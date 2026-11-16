package com.upiq.notifications;

import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final TransactionRepository transactions;

    /** Builds non-persistent, user-scoped spending observations from the user's own ledger. */
    public List<NotificationItem> getNotifications(Long userId) {
        YearMonth current = YearMonth.now();
        YearMonth previous = current.minusMonths(1);
        List<Transaction> rows = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                previous.atDay(1).atStartOfDay(), current.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1));
        Map<String, BigDecimal> currentSpend = totals(rows, current);
        Map<String, BigDecimal> previousSpend = totals(rows, previous);
        List<NotificationItem> notifications = new ArrayList<>();
        currentSpend.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
            String category = entry.getKey();
            BigDecimal amount = entry.getValue();
            BigDecimal prior = previousSpend.get(category);
            if (prior != null && prior.compareTo(BigDecimal.ZERO) > 0
                    && amount.compareTo(prior.multiply(BigDecimal.valueOf(1.5))) >= 0
                    && amount.subtract(prior).compareTo(BigDecimal.valueOf(1000)) >= 0) {
                notifications.add(NotificationItem.builder().id("spend-change-" + current + "-" + category)
                        .type("spending_change").title("Spending changed in " + category)
                        .message("Recorded spending is at least 50% higher than last month and increased by at least 1000.")
                        .build());
            }
        });
        return List.copyOf(notifications);
    }

    private static Map<String, BigDecimal> totals(List<Transaction> rows, YearMonth month) {
        return rows.stream().filter(t -> t.getDate() != null && month.equals(YearMonth.from(t.getDate()))
                        && t.getType() != null && t.getType().equalsIgnoreCase("expense")
                        && t.getAmount() != null)
                .collect(Collectors.groupingBy(t -> t.getCategory() == null || t.getCategory().isBlank()
                                ? "Uncategorized" : t.getCategory().trim(),
                        Collectors.mapping(Transaction::getAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
    }
}
