package com.upiq.fraud;

import com.upiq.notifications.NotificationRepository;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FraudDetectionServiceTest {
    private final TransactionRepository transactions = mock(TransactionRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final FraudDetectionService service = new FraudDetectionService(transactions, notifications);

    @Test
    void combinesHighAmountCategorySpikeAndDuplicateSignalsWithoutDeclaringFraud() {
        LocalDateTime target = LocalDateTime.now().minusDays(2).withHour(12).withMinute(0).withSecond(0).withNano(0);
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(1L), any(), any())).thenReturn(List.of(
                tx(1L, 1L, "expense", "1,000.00", "Shopping", "Store", target.minusDays(30)),
                tx(2L, 1L, "expense", "1,500.00", "Shopping", "Store", target.minusDays(20)),
                tx(3L, 1L, "expense", "2,000.00", "Shopping", "Store", target.minusDays(10)),
                tx(4L, 1L, "expense", "50,000.00", "Shopping", "Store", target),
                tx(5L, 1L, "expense", "50,000.00", "Shopping", "Store", target),
                tx(6L, 2L, "expense", "100,000.00", "Shopping", "Store", target)));

        FraudAlertsResponse result = service.getAlerts(1L);

        assertEquals(2, result.alertCount());
        FraudAlert repeated = result.alerts().stream().filter(alert -> alert.transactionId().equals(5L)).findFirst().orElseThrow();
        assertEquals("HIGH", repeated.riskLevel());
        assertEquals(List.of("HIGH_AMOUNT", "CATEGORY_SPIKE", "POSSIBLE_DUPLICATE"),
                repeated.reasons().stream().map(FraudAlertReason::code).toList());
        assertTrue(result.disclaimer().contains("not a finding of fraud"));
        verify(notifications).insertIfAbsent(1L, "fraud-review:4", "fraud_review", "Transaction needs review",
                "A recorded transaction matched one or more review rules. Open Security & Fraud to review it.");
        verify(notifications).insertIfAbsent(1L, "fraud-review:5", "fraud_review", "Transaction needs review",
                "A recorded transaction matched one or more review rules. Open Security & Fraud to review it.");
        verify(notifications, never()).insertIfAbsent(eq(2L), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void singleHighAmountSignalIsLowRiskAndRepeatedScansUseStableNotificationKeys() {
        LocalDateTime date = LocalDateTime.now().minusDays(1);
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(7L), any(), any()))
                .thenReturn(List.of(tx(70L, 7L, "expense", "50,000.00", "Travel", "Trip", date)));

        FraudAlertsResponse first = service.getAlerts(7L);
        FraudAlertsResponse second = service.getAlerts(7L);

        assertEquals("LOW", first.alerts().get(0).riskLevel());
        assertEquals(1, first.alerts().get(0).reasons().size());
        assertEquals(1, second.alertCount());
        verify(notifications, times(2)).insertIfAbsent(7L, "fraud-review:70", "fraud_review",
                "Transaction needs review", "A recorded transaction matched one or more review rules. Open Security & Fraud to review it.");
    }

    @Test
    void ignoresForeignUsersIncomeAndZeroOrNegativeRowsAndReturnsEmptyState() {
        LocalDateTime date = LocalDateTime.now().minusDays(1);
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(1L), any(), any())).thenReturn(List.of(
                tx(1L, 2L, "expense", "90,000.00", "Other", "Store", date),
                tx(2L, 1L, "income", "90,000.00", "Salary", "Payroll", date),
                tx(3L, 1L, "expense", "0.00", "Other", "Store", date),
                tx(4L, 1L, "expense", "-90.00", "Other", "Store", date)));

        FraudAlertsResponse result = service.getAlerts(1L);

        assertEquals(0, result.alertCount());
        assertTrue(result.alerts().isEmpty());
        verifyNoInteractions(notifications);
    }

    private static Transaction tx(Long id, Long userId, String type, String amount, String category,
            String description, LocalDateTime date) {
        return Transaction.builder().id(id).userId(userId).type(type).amount(new BigDecimal(amount.replace(",", "")))
                .category(category).description(description).paymentMethod("UPI").date(date).build();
    }
}
