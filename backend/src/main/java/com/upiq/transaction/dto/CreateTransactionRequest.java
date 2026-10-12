package com.upiq.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransactionRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private Double amount;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(?i)(income|expense)$", message = "Type must be 'income' or 'expense'")
    private String type;

    private String category;

    private String description;

    private String paymentMethod;

    private String date; // Changed to String to handle formats manually
}
