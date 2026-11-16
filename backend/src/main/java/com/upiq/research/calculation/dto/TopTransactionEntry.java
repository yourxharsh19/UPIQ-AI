package com.upiq.research.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

/**
 * A single transaction entry used in top-N result lists.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopTransactionEntry {
    private Long transactionId;
    private Long userId;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal amount;
    private String type;
    private String category;
    private String description;
    private LocalDateTime date;
    private String paymentMethod;
    private int rank;
}
