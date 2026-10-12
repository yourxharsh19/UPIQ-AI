package com.upiq.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GlobalExceptionHandlerTest {

    @Test
    void genericFailuresDoNotExposeInternalExceptionMessages() {
        String internalDetail = "SQL failed for private-user marker";

        ResponseEntity<ApiResponse<String>> response = new GlobalExceptionHandler()
                .handleGenericException(new IllegalStateException(internalDetail));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("An unexpected error occurred", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains(internalDetail));
    }
}
