package com.upiq.notifications;

import com.upiq.budget.model.Budget;
import com.upiq.budget.repository.BudgetRepository;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final BigDecimal SPENDING_INCREASE_RATIO = new BigDecimal("1.50");
    private static final BigDecimal MIN_SPENDING_INCREASE = new BigDecimal("1000.00");
    private final TransactionRepository transactions;
    private final BudgetRepository budgets;
    private final NotificationRepository notifications;

    @Transactional
    public List<NotificationItem> getNotifications(Long userId) {
        YearMonth current = YearMonth.now();
        YearMonth previous = current.minusMonths(1);
        LocalDate start = previous.atDay(1);
        LocalDate nextMonth = current.plusMonths(1).atDay(1);
        List<Transaction> rows = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                start.atStartOfDay(), nextMonth.atStartOfDay().minusNanos(1));
        Map<String, BigDecimal> currentSpend = totals(rows, current);
        Map<String, BigDecimal> previousSpend = totals(rows, previous);

        for (Budget budget : budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(userId, current.atDay(1))) {
            BigDecimal amount = budget.getAmount();
            BigDecimal spent = budget.getCategory() == null
                    ? currentSpend.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    : currentSpend.getOrDefault(categoryKey(budget.getCategory()), BigDecimal.ZERO);
            if (spent.multiply(BigDecimal.valueOf(100)).compareTo(amount.multiply(BigDecimal.valueOf(80))) >= 0) {
                saveIfAbsent(userId, "budget:" + budget.getId() + ":" + current + ":80",
                        "budget_threshold", "Budget nearly reached",
                        budget.getCategory() == null ? "Recorded spending reached at least 80% of your monthly budget."
                                : "Recorded spending in " + budget.getCategory() + " reached at least 80% of its monthly budget.");
            }
            if (spent.compareTo(amount) > 0) {
                saveIfAbsent(userId, "budget:" + budget.getId() + ":" + current + ":100",
                        "budget_overspend", "Monthly budget exceeded",
                        budget.getCategory() == null ? "Recorded spending exceeded your monthly budget."
                                : "Recorded spending in " + budget.getCategory() + " exceeded its monthly budget.");
            }
        }

        currentSpend.forEach((category, amount) -> {
            BigDecimal prior = previousSpend.get(category);
            if (prior != null && prior.signum() > 0
                    && amount.compareTo(prior.multiply(SPENDING_INCREASE_RATIO)) >= 0
                    && amount.subtract(prior).compareTo(MIN_SPENDING_INCREASE) >= 0) {
                String label = displayCategory(rows, category);
                saveIfAbsent(userId, "spending-change:" + current + ":" + category,
                        "spending_change", "Spending changed in " + label,
                        "Recorded spending is at least 50% higher than last month and increased by at least 1,000.");
            }
        });
        return notifications.findByUser_IdAndDismissedAtIsNullOrderByCreatedAtDesc(userId)
                .stream().map(NotificationService::toItem).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notifications.countByUser_IdAndReadAtIsNullAndDismissedAtIsNull(userId);
    }

    @Transactional
    public NotificationItem markRead(Long userId, Long notificationId) {
        Notification notification = ownedNotification(userId, notificationId);
        if (notification.getReadAt() == null) notification.setReadAt(LocalDateTime.now());
        return toItem(notifications.save(notification));
    }

    @Transactional
    public NotificationItem dismiss(Long userId, Long notificationId) {
        Notification notification = ownedNotification(userId, notificationId);
        LocalDateTime now = LocalDateTime.now();
        if (notification.getReadAt() == null) notification.setReadAt(now);
        if (notification.getDismissedAt() == null) notification.setDismissedAt(now);
        return toItem(notifications.save(notification));
    }

    private Notification ownedNotification(Long userId, Long notificationId) {
        return notifications.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(NotificationNotFoundException::new);
    }

    private void saveIfAbsent(Long userId, String key, String type, String title, String message) {
        notifications.insertIfAbsent(userId, key, type, title, message);
    }

    private static Map<String, BigDecimal> totals(List<Transaction> rows, YearMonth month) {
        Map<String, BigDecimal> totals = new HashMap<>();
        for (Transaction transaction : rows) {
            if (transaction.getDate() == null || !month.equals(YearMonth.from(transaction.getDate()))
                    || transaction.getType() == null || !transaction.getType().equalsIgnoreCase("expense")
                    || transaction.getAmount() == null || transaction.getAmount().signum() < 0) continue;
            totals.merge(categoryKey(transaction.getCategory()), transaction.getAmount(), BigDecimal::add);
        }
        return totals;
    }

    private static String categoryKey(String category) {
        return category == null || category.isBlank() ? "uncategorized" : category.trim().toLowerCase(Locale.ROOT);
    }

    private static String displayCategory(List<Transaction> rows, String categoryKey) {
        return rows.stream().filter(t -> categoryKey(t.getCategory()).equals(categoryKey))
                .map(Transaction::getCategory).filter(value -> value != null && !value.isBlank())
                .findFirst().orElse("Uncategorized");
    }

    private static NotificationItem toItem(Notification notification) {
        return NotificationItem.builder().id(notification.getId()).type(notification.getType())
                .title(notification.getTitle()).message(notification.getMessage())
                .read(notification.getReadAt() != null).createdAt(notification.getCreatedAt()).build();
    }
}
