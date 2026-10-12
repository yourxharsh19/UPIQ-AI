package com.upiq.research.llm;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OllamaClientTest {

    @Test
    void blankConfiguredModelFailsBeforeAnyProviderRequest() {
        OllamaProperties properties = new OllamaProperties();
        properties.setBaseUrl("http://localhost:11434");
        properties.setModel("");
        OllamaClient client = new OllamaClient(properties, RestClient.builder());

        OllamaClientException error = assertThrows(OllamaClientException.class,
                () -> client.generate("What is a budget?"));

        assertEquals(OllamaClientException.Kind.INVALID_CONFIGURATION, error.getKind());
        assertTrue(error.getMessage().contains("ollama.model is not configured"));
    }

    @Test
    void retriesTransientServerFailureOnceThenSucceeds() throws IOException {
        AtomicInteger calls = new AtomicInteger();
        withServer((exchange) -> {
            if (calls.incrementAndGet() == 1) {
                exchange.sendResponseHeaders(503, -1);
            } else {
                respond(exchange, 200, "{\"model\":\"test\",\"response\":\"OK\"}");
            }
        }, port -> {
            OllamaGenerateResponse response = client(port).generate("Question");
            assertEquals("OK", response.getResponse());
            assertEquals(2, calls.get());
        });
    }

    @Test
    void retriesReadTimeoutOnceThenSucceeds() throws IOException {
        AtomicInteger calls = new AtomicInteger();
        CountDownLatch releaseTimedOutRequest = new CountDownLatch(1);
        withServer(exchange -> {
            if (calls.incrementAndGet() == 1) {
                await(releaseTimedOutRequest);
            } else {
                respond(exchange, 200, "{\"model\":\"test\",\"response\":\"OK\"}");
            }
        }, port -> {
            try {
                OllamaGenerateResponse response = client(port, Duration.ofMillis(100)).generate("Question");
                assertEquals("OK", response.getResponse());
                assertEquals(2, calls.get());
            } finally {
                releaseTimedOutRequest.countDown();
            }
        });
    }

    @Test
    void timeoutRetryExhaustionThrowsTimeoutAfterExactlyTwoAttempts() throws IOException {
        AtomicInteger calls = new AtomicInteger();
        CountDownLatch releaseTimedOutRequests = new CountDownLatch(1);
        withServer(exchange -> {
            calls.incrementAndGet();
            await(releaseTimedOutRequests);
        }, port -> {
            try {
                OllamaClientException error = assertThrows(OllamaClientException.class,
                        () -> client(port, Duration.ofMillis(100)).generate("Question"));
                assertEquals(OllamaClientException.Kind.TIMEOUT, error.getKind());
                assertEquals(2, calls.get());
            } finally {
                releaseTimedOutRequests.countDown();
            }
        });
    }

    @Test
    void doesNotRetryPermanentHttpFailure() throws IOException {
        AtomicInteger calls = new AtomicInteger();
        withServer(exchange -> {
            calls.incrementAndGet();
            exchange.sendResponseHeaders(400, -1);
        }, port -> {
            OllamaClientException error = assertThrows(OllamaClientException.class,
                    () -> client(port).generate("Question"));
            assertEquals(OllamaClientException.Kind.HTTP_ERROR, error.getKind());
            assertEquals(1, calls.get());
        });
    }

    @Test
    void retryExhaustionReturnsControlledHttpFailureAfterConfiguredAttempts() throws IOException {
        AtomicInteger calls = new AtomicInteger();
        withServer(exchange -> {
            calls.incrementAndGet();
            exchange.sendResponseHeaders(503, -1);
        }, port -> {
            OllamaClientException error = assertThrows(OllamaClientException.class,
                    () -> client(port).generate("Question"));
            assertEquals(OllamaClientException.Kind.HTTP_ERROR, error.getKind());
            assertEquals(2, calls.get());
        });
    }

    @Test
    void classifiesSocketTimeoutAsTimeout() {
        OllamaClientException error = OllamaClient.mapTransportFailure(
                new org.springframework.web.client.ResourceAccessException("read timed out",
                        new java.net.SocketTimeoutException("Read timed out")));
        assertEquals(OllamaClientException.Kind.TIMEOUT, error.getKind());
    }

    private static OllamaClient client(int port) {
        return client(port, Duration.ofSeconds(60));
    }

    private static OllamaClient client(int port, Duration timeout) {
        OllamaProperties properties = new OllamaProperties();
        properties.setBaseUrl("http://localhost:" + port);
        properties.setModel("test-model");
        properties.setTimeout(timeout);
        return new OllamaClient(properties, RestClient.builder());
    }

    private static void withServer(Handler handler, PortAction action) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        ExecutorService executor = Executors.newCachedThreadPool();
        server.setExecutor(executor);
        server.createContext("/api/generate", exchange -> {
            try (exchange) { handler.handle(exchange); }
        });
        server.start();
        try {
            action.run(server.getAddress().getPort());
        } finally {
            server.stop(0);
            executor.shutdownNow();
        }
    }

    private static void await(CountDownLatch latch) throws IOException {
        try {
            latch.await();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IOException("Test server handler interrupted", ex);
        }
    }

    private static void respond(com.sun.net.httpserver.HttpExchange exchange, int status, String body)
            throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
    }

    @FunctionalInterface private interface Handler {
        void handle(com.sun.net.httpserver.HttpExchange exchange) throws IOException;
    }

    @FunctionalInterface private interface PortAction {
        void run(int port);
    }
}
