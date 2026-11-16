package com.upiq.fraud;

import java.time.LocalDate;
import java.util.List;

public record FraudAlertsResponse(LocalDate analysisStartDate, LocalDate analysisEndDate,
        int alertCount, List<FraudAlert> alerts, String disclaimer) {
}
