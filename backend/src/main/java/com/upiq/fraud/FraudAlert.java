package com.upiq.fraud;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FraudAlert(@JsonSerialize(using = ToStringSerializer.class) Long transactionId, LocalDateTime date,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
        String type, String category, String description, String paymentMethod,
        String riskLevel, List<FraudAlertReason> reasons) {
}
