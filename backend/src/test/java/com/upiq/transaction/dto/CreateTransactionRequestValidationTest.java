package com.upiq.transaction.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateTransactionRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsZeroAndNegativeAmountsButKeepsAllowedTypeCaseInsensitive() {
        CreateTransactionRequest request = new CreateTransactionRequest(0d, "EXPENSE", "Food", "Cafe", "UPI", null);

        assertTrue(validator.validate(request).stream().anyMatch(error -> error.getPropertyPath().toString().equals("amount")));

        request.setAmount(-1d);
        assertTrue(validator.validate(request).stream().anyMatch(error -> error.getPropertyPath().toString().equals("amount")));

        request.setAmount(1d);
        assertTrue(validator.validate(request).stream().noneMatch(error -> error.getPropertyPath().toString().equals("type")));
    }
}
