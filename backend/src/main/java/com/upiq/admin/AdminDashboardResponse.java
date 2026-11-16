package com.upiq.admin;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

@Value
@Builder
public class AdminDashboardResponse {
    long userCount;
    long activeUserCount;
    long transactionCount;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal recordedIncome;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal recordedExpenses;
}
