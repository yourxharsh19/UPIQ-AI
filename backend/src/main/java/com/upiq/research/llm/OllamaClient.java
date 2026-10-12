package com.upiq.research.llm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.net.SocketException;
import java.net.ConnectException;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Local Ollama HTTP client ({@code POST /api/generate}, non-streaming).
 * Does not download models and does not call cloud LLM APIs.
 */
@Slf4j
@Component
public class OllamaClient {

    static final String GENERATE_PATH = "/api/generate";
    static final int MAX_ATTEMPTS = 2;
    static final long RETRY_BACKOFF_MS = 500;

    private final OllamaProperties properties;
    private final RestClient restClient;

    public OllamaClient(OllamaProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        Duration timeout = properties.getTimeout() != null ? properties.getTimeout() : Duration.ofSeconds(60);
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);
        this.restClient = restClientBuilder
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .requestFactory(requestFactory)
                .build();
    }

    public OllamaGenerateResponse generate(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new OllamaClientException(
                    OllamaClientException.Kind.INVALID_CONFIGURATION, "prompt is required");
        }
        String model = properties.getModel();
        if (model == null || model.isBlank()) {
            throw new OllamaClientException(
                    OllamaClientException.Kind.INVALID_CONFIGURATION,
                    "ollama.model is not configured");
        }

        OllamaGenerateRequest request = OllamaGenerateRequest.builder()
                .model(model)
                .prompt(prompt)
                .stream(false)
                .options(optionsMap(properties.getTemperature()))
                .build();

        long startedAt = System.nanoTime();
        log.info("Ollama generation started endpoint={} stream=false", GENERATE_PATH);

        for (int attempt = 1; ; attempt++) {
            try {
                OllamaGenerateResponse body = request(request);
                log.info("Ollama generation completed attempt={} elapsedMs={}", attempt, elapsedMs(startedAt));
                return body;
            } catch (OllamaClientException ex) {
                boolean retry = attempt < MAX_ATTEMPTS && isRetryable(ex);
                Throwable cause = ex.getCause();
                String exceptionClass = cause == null ? ex.getClass().getSimpleName()
                        : cause.getClass().getSimpleName();
                log.warn("Ollama generation failed attempt={} kind={} exceptionClass={} elapsedMs={} retry={}",
                        attempt, ex.getKind(), exceptionClass, elapsedMs(startedAt), retry);
                if (!retry) throw ex;
                try {
                    Thread.sleep(RETRY_BACKOFF_MS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new OllamaClientException(ex.getKind(), "Ollama retry was interrupted", ex);
                }
            }
        }
    }

    private OllamaGenerateResponse request(OllamaGenerateRequest request) {
        try {
            OllamaGenerateResponse body = restClient.post()
                    .uri(GENERATE_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(OllamaGenerateResponse.class);
            if (body == null) {
                throw new OllamaClientException(
                        OllamaClientException.Kind.MALFORMED_RESPONSE,
                        "Ollama returned an empty HTTP body");
            }
            if (body.getResponse() == null || body.getResponse().isBlank()) {
                throw new OllamaClientException(
                        OllamaClientException.Kind.EMPTY_RESPONSE,
                        "Ollama returned an empty model response");
            }
            return body;
        } catch (RestClientResponseException ex) {
            throw new OllamaClientException(
                    OllamaClientException.Kind.HTTP_ERROR,
                    "Ollama HTTP " + ex.getStatusCode().value() + " from " + GENERATE_PATH,
                    ex);
        } catch (ResourceAccessException ex) {
            throw mapTransportFailure(ex);
        } catch (RestClientException ex) {
            if (isTimeout(ex)) {
                throw new OllamaClientException(
                        OllamaClientException.Kind.TIMEOUT,
                        "Ollama request timed out",
                        ex);
            }
            if (hasCauseNamed(ex, "HttpMessageNotReadableException")) {
                throw new OllamaClientException(
                        OllamaClientException.Kind.MALFORMED_RESPONSE,
                        "Ollama returned a malformed JSON response",
                        ex);
            }
            throw new OllamaClientException(
                    OllamaClientException.Kind.CLIENT_ERROR,
                    "Ollama request failed",
                    ex);
        } catch (OllamaClientException ex) {
            throw ex;
        }
    }

    private static boolean isRetryable(OllamaClientException exception) {
        if (exception.getKind() == OllamaClientException.Kind.TIMEOUT) return true;
        if (exception.getKind() == OllamaClientException.Kind.UNAVAILABLE) {
            Throwable cause = exception.getCause();
            if (!(cause instanceof ResourceAccessException)) return false;
            for (Throwable current = cause.getCause(); current != null; current = current.getCause()) {
                if (current instanceof ConnectException || current instanceof SocketException
                        || current instanceof UnknownHostException) return true;
            }
            return false;
        }
        if (exception.getKind() != OllamaClientException.Kind.HTTP_ERROR
                || !(exception.getCause() instanceof RestClientResponseException response)) return false;
        int status = response.getStatusCode().value();
        return status == 429 || status >= 500;
    }

    private static long elapsedMs(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    OllamaProperties properties() {
        return properties;
    }

    private static Map<String, Object> optionsMap(double temperature) {
        Map<String, Object> options = new LinkedHashMap<>();
        options.put("temperature", temperature);
        return options;
    }

    static OllamaClientException mapTransportFailure(ResourceAccessException ex) {
        if (isTimeout(ex)) {
            return new OllamaClientException(
                    OllamaClientException.Kind.TIMEOUT,
                    "Ollama request timed out",
                    ex);
        }
        return new OllamaClientException(
                OllamaClientException.Kind.UNAVAILABLE,
                "Ollama is unavailable at the configured base-url",
                ex);
    }

    private static boolean isTimeout(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof SocketTimeoutException) {
                return true;
            }
            String name = current.getClass().getName();
            if (name.contains("Timeout") || name.contains("timed out")) {
                return true;
            }
            if (current.getMessage() != null && current.getMessage().toLowerCase().contains("timed out")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private static boolean hasCauseNamed(Throwable ex, String simpleClassName) {
        Throwable current = ex;
        while (current != null) {
            if (current.getClass().getSimpleName().equals(simpleClassName)) return true;
            current = current.getCause();
        }
        return false;
    }

    private static String trimTrailingSlash(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "http://localhost:11434";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
