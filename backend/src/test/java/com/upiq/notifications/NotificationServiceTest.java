package com.upiq.notifications;

import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import java.time.YearMonth;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceTest {
    @Test
    void createsSpendingChangeOnlyFromTheRequestedUsersPriorAndCurrentMonth() {
        TransactionRepository repository = mock(TransactionRepository.class);
        YearMonth now = YearMonth.now();
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(org.mockito.ArgumentMatchers.eq(12L), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(List.of(
                tx(12L, "expense", "Food", 2500, now.atEndOfMonth().atTime(23, 59, 59)),
                tx(12L, "expense", "Food", 1000, now.minusMonths(1).atDay(1).atStartOfDay())));
        List<NotificationItem> result = new NotificationService(repository).getNotifications(12L);
        assertEquals(1, result.size());
        assertEquals("spending_change", result.get(0).getType());
        verify(repository).findByUserIdAndDateBetweenOrderByDateDesc(
                eq(12L), eq(now.minusMonths(1).atDay(1).atStartOfDay()),
                eq(now.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1)));
    }

    @Test
    void emptyTransactionHistoryReturnsNoNotifications() {
        TransactionRepository repository = mock(TransactionRepository.class);
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(org.mockito.ArgumentMatchers.eq(12L),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        assertTrue(new NotificationService(repository).getNotifications(12L).isEmpty());
    }

    @Test
    void doesNotNotifyWithoutComparablePriorSpendOrWhenIncreaseIsBelowThreshold() {
        TransactionRepository repository = mock(TransactionRepository.class);
        YearMonth now = YearMonth.now();
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(org.mockito.ArgumentMatchers.eq(12L),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(List.of(
                tx(12L, "expense", "Food", 1500, now.atDay(1).atStartOfDay()),
                tx(12L, "expense", "Food", 1000, now.minusMonths(1).atEndOfMonth().atTime(23, 59, 59)),
                tx(12L, "expense", "Shopping", 5000, now.atDay(10).atStartOfDay()),
                tx(12L, "expense", "Transport", 1000, now.minusMonths(1).atDay(1).atStartOfDay())));

        assertTrue(new NotificationService(repository).getNotifications(12L).isEmpty());
    }

    private static Transaction tx(Long user, String type, String category, double amount, LocalDateTime date) {
        return Transaction.builder().userId(user).type(type).category(category).amount(BigDecimal.valueOf(amount))
                .date(date).build();
    }
}
