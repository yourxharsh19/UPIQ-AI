package com.upiq.notifications;

import com.upiq.budget.model.Budget;
import com.upiq.budget.repository.BudgetRepository;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {
    private final TransactionRepository transactions = mock(TransactionRepository.class);
    private final BudgetRepository budgets = mock(BudgetRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final NotificationService service = new NotificationService(transactions, budgets, notifications);

    @Test
    void generatesStableSpendingChangeForTheRequestedUserAndMonth() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any())).thenReturn(List.of(
                tx("expense", "Food", "2500.00", month.atEndOfMonth().atTime(23, 59, 59)),
                tx("expense", "Food", "1000.00", month.minusMonths(1).atDay(1).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(12L), eq(month.atDay(1)))).thenReturn(List.of());
        when(notifications.findByUser_IdAndDismissedAtIsNullOrderByCreatedAtDesc(12L)).thenReturn(List.of(item(1L, false)));

        List<NotificationItem> result = service.getNotifications(12L);

        assertEquals(1, result.size());
        assertEquals("spending_change", result.get(0).getType());
        verify(notifications).insertIfAbsent(eq(12L), eq("spending-change:" + month + ":food"),
                eq("spending_change"), contains("Food"), anyString());
        verify(transactions).findByUserIdAndDateBetweenOrderByDateDesc(eq(12L),
                eq(month.minusMonths(1).atDay(1).atStartOfDay()),
                eq(month.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1)));
    }

    @Test
    void generatesBudgetThresholdAndOverspendEventsFromThatUsersLedger() {
        YearMonth month = YearMonth.now();
        Budget food = new Budget();
        food.setId(44L);
        food.setCategory("Food");
        food.setPeriodStart(month.atDay(1));
        food.setAmount(new BigDecimal("100.00"));
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any()))
                .thenReturn(List.of(tx("expense", "food", "120.00", month.atDay(10).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(12L, month.atDay(1))).thenReturn(List.of(food));
        when(notifications.findByUser_IdAndDismissedAtIsNullOrderByCreatedAtDesc(12L)).thenReturn(List.of());

        service.getNotifications(12L);

        verify(notifications).insertIfAbsent(12L, "budget:44:" + month + ":80", "budget_threshold",
                "Budget nearly reached", "Recorded spending in Food reached at least 80% of its monthly budget.");
        verify(notifications).insertIfAbsent(12L, "budget:44:" + month + ":100", "budget_overspend",
                "Monthly budget exceeded", "Recorded spending in Food exceeded its monthly budget.");
    }

    @Test
    void emptyHistoryReturnsEmptyPersistedInboxAndUsesUserScopedRepositoryQueries() {
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(17L), any(), any())).thenReturn(List.of());
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(17L), any())).thenReturn(List.of());
        when(notifications.findByUser_IdAndDismissedAtIsNullOrderByCreatedAtDesc(17L)).thenReturn(List.of());

        assertTrue(service.getNotifications(17L).isEmpty());
        verify(notifications, never()).insertIfAbsent(anyLong(), anyString(), anyString(), anyString(), anyString());
        verify(notifications).findByUser_IdAndDismissedAtIsNullOrderByCreatedAtDesc(17L);
    }

    @Test
    void readAndDismissRequireOwnershipAndDismissalAlsoMarksRead() {
        Notification notification = item(5L, false);
        when(notifications.findByIdAndUser_Id(5L, 12L)).thenReturn(Optional.of(notification));
        when(notifications.save(notification)).thenReturn(notification);

        NotificationItem marked = service.markRead(12L, 5L);
        assertTrue(marked.isRead());
        NotificationItem dismissed = service.dismiss(12L, 5L);
        assertTrue(dismissed.isRead());
        assertNotNull(notification.getDismissedAt());
        verify(notifications, times(2)).findByIdAndUser_Id(5L, 12L);
    }

    @Test
    void anotherUserCannotReadOrDismissNotification() {
        when(notifications.findByIdAndUser_Id(5L, 99L)).thenReturn(Optional.empty());
        assertThrows(NotificationNotFoundException.class, () -> service.markRead(99L, 5L));
        assertThrows(NotificationNotFoundException.class, () -> service.dismiss(99L, 5L));
        verify(notifications, never()).save(any());
    }

    @Test
    void unreadCountIsDelegatedToOwnerScopedQuery() {
        when(notifications.countByUser_IdAndReadAtIsNullAndDismissedAtIsNull(12L)).thenReturn(3L);
        assertEquals(3L, service.getUnreadCount(12L));
        verify(notifications).countByUser_IdAndReadAtIsNullAndDismissedAtIsNull(12L);
    }

    private static Transaction tx(String type, String category, String amount, LocalDateTime date) {
        return Transaction.builder().userId(12L).type(type).category(category)
                .amount(new BigDecimal(amount)).date(date).build();
    }

    private static Notification item(Long id, boolean read) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setEventKey("synthetic-event-" + id);
        notification.setType("spending_change");
        notification.setTitle("Spending changed");
        notification.setMessage("Synthetic notification");
        notification.setCreatedAt(LocalDateTime.now());
        if (read) notification.setReadAt(LocalDateTime.now());
        return notification;
    }
}
