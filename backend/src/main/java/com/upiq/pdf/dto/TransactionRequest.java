package com.upiq.pdf.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    private String type;       // expense / income

    private String category;   // optional, user assigns manually

    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;

    private String paymentMethod; // UPI, Cash, Card, Net Banking

    /** Stable zero-based parser row/block position; preserved when invalid rows are filtered. */
    private Integer sourceRowIndex;
}

