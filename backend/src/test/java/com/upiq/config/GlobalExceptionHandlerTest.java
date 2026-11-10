package com.upiq.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.MethodArgumentNotValidException;
import com.upiq.auth.dto.RegisterRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;

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

    @Test
    void missingTransactionReturnsNotFoundWithoutInternalDetails() {
        var response = new GlobalExceptionHandler().handleNotFoundException(
                new com.upiq.transaction.exceptions.TransactionNotFoundException("internal identifier detail"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("The requested resource was not found", response.getBody().getMessage());
    }

    @Test
    void missingCategoryReturnsNotFoundWithoutInternalDetails() {
        var response = new GlobalExceptionHandler().handleNotFoundException(
                new com.upiq.category.exceptions.CategoryNotFoundException("internal identifier detail"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("The requested resource was not found", response.getBody().getMessage());
    }

    @Test
    void validationFailuresUseTheCommonApiResponseShape() throws Exception {
        RegisterRequest request = new RegisterRequest();
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(request, "request");
        binding.addError(new FieldError("request", "email", "invalid"));
        MethodParameter parameter = new MethodParameter(getClass().getDeclaredMethod("sample", RegisterRequest.class), 0);
        var response = new GlobalExceptionHandler()
                .handleValidationExceptions(new MethodArgumentNotValidException(parameter, binding));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(false, response.getBody().getSuccess());
        assertEquals("Invalid input data", response.getBody().getMessage());
        assertEquals("invalid", response.getBody().getData().get("email"));
    }

    private void sample(RegisterRequest request) { }
}
