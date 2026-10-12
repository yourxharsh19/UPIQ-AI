package com.upiq.research.llm;

/**
 * Application-level failure talking to the local Ollama HTTP API.
 * Does not invent a financial answer.
 */
public class OllamaClientException extends RuntimeException {

    public enum Kind {
        UNAVAILABLE,
        TIMEOUT,
        HTTP_ERROR,
        MALFORMED_RESPONSE,
        EMPTY_RESPONSE,
        INVALID_CONFIGURATION,
        CLIENT_ERROR
    }

    private final Kind kind;

    public OllamaClientException(Kind kind, String message) {
        super(message);
        this.kind = kind;
    }

    public OllamaClientException(Kind kind, String message, Throwable cause) {
        super(message, cause);
        this.kind = kind;
    }

    public Kind getKind() {
        return kind;
    }
}
