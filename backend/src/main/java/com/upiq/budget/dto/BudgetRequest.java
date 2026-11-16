package com.upiq.budget.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class BudgetRequest {
    @NotNull
    @Positive
    @Digits(integer = 17, fraction = 2)
    @DecimalMax("99999999999999999.99")
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal amount;

    @NotBlank
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Month must use YYYY-MM format")
    private String month;

    @Size(max = 255)
    private String category;
}
