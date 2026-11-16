package com.upiq.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.DecimalMax;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransactionRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    @Digits(integer = 17, fraction = 2, message = "Amount must have at most 17 integer and 2 fractional digits")
    @DecimalMax(value = "99999999999999999.99", message = "Amount exceeds NUMERIC(19,2) range")
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal amount;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(?i)(income|expense)$", message = "Type must be 'income' or 'expense'")
    private String type;

    private String category;

    private String description;

    private String paymentMethod;

    private String date; // Changed to String to handle formats manually
}
