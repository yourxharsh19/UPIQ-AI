package com.upiq.transaction.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateTransactionRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsZeroAndNegativeAmountsButKeepsAllowedTypeCaseInsensitive() {
        CreateTransactionRequest request = new CreateTransactionRequest(new BigDecimal("0.00"), "EXPENSE", "Food", "Cafe", "UPI", null);

        assertTrue(validator.validate(request).stream().anyMatch(error -> error.getPropertyPath().toString().equals("amount")));

        request.setAmount(new BigDecimal("-1.00"));
        assertTrue(validator.validate(request).stream().anyMatch(error -> error.getPropertyPath().toString().equals("amount")));

        request.setAmount(new BigDecimal("1.00"));
        assertTrue(validator.validate(request).stream().noneMatch(error -> error.getPropertyPath().toString().equals("type")));
    }

    @Test
    void acceptsExactTwoDecimalInputsAndNumericRangeButRejectsExtraScaleAndOverflow() {
        CreateTransactionRequest request = new CreateTransactionRequest(new BigDecimal("0.10"), "expense", null, "Coffee", null, null);
        assertTrue(validator.validate(request).isEmpty());

        request.setAmount(new BigDecimal("99999999999999999.99"));
        assertTrue(validator.validate(request).isEmpty());

        request.setAmount(new BigDecimal("1.001"));
        assertTrue(validator.validate(request).stream().anyMatch(error -> error.getPropertyPath().toString().equals("amount")));

        request.setAmount(new BigDecimal("100000000000000000.00"));
        assertTrue(validator.validate(request).stream().anyMatch(error -> error.getPropertyPath().toString().equals("amount")));
    }

    @Test
    void serializesTransactionResponseAmountAsAnExactDecimalString() throws Exception {
        var response = com.upiq.transaction.dto.TransactionResponse.builder()
                .amount(new BigDecimal("0.10"))
                .build();
        String json = new ObjectMapper().writeValueAsString(response);
        assertTrue(json.contains("\"amount\":\"0.10\""));
    }
}
