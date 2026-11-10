package com.upiq.auth.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsPasswordAtMinimumLength() {
        assertTrue(validator.validate(request("123456789012")).isEmpty());
    }

    @Test
    void rejectsPasswordBelowMinimumLength() {
        assertFalse(validator.validate(request("12345678901")).isEmpty());
    }

    @Test
    void rejectsPasswordOverMaximumLength() {
        assertFalse(validator.validate(request("x".repeat(73))).isEmpty());
    }

    @Test
    void rejectsPasswordOverBcryptUtf8ByteLimit() {
        assertFalse(validator.validate(request("😀".repeat(19))).isEmpty());
    }

    private RegisterRequest request(String password) {
        return RegisterRequest.builder().email("person@example.com").userName("Person").password(password).build();
    }
}
