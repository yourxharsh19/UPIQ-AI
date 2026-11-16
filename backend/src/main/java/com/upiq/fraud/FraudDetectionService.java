package com.upiq.fraud;

import com.upiq.notifications.NotificationRepository;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FraudDetectionService {
    private static final int HISTORY_DAYS = 180;
    private static final int DISPLAY_DAYS = 90;
    private static final int MAX_ALERTS = 50;
    private static final int MIN_CATEGORY_HISTORY = 3;
    private static final BigDecimal HIGH_AMOUNT_THRESHOLD = new BigDecimal("50000.00");
    private static final BigDecimal CATEGORY_SPIKE_MINIMUM = new BigDecimal("5000.00");
    private static final BigDecimal CATEGORY_SPIKE_MULTIPLIER = new BigDecimal("3.00");
    private static final String DISCLAIMER = "These are explainable review signals, not a finding of fraud. Risk labels summarize matched rules, not fraud probabilities. Confirm details with your bank if you do not recognize a transaction.";

    private final TransactionRepository transactions;
    private final NotificationRepository notifications;

    @Transactional
    public FraudAlertsResponse getAlerts(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(DISPLAY_DAYS - 1L);
        LocalDateTime endTime = today.plusDays(1).atStartOfDay().minusNanos(1);
        List<Transaction> history = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                today.minusDays(HISTORY_DAYS).atStartOfDay(), endTime).stream()
                .filter(row -> row.getUserId() != null && row.getUserId().equals(userId))
                .filter(row -> row.getDate() != null && !row.getDate().toLocalDate().isBefore(today.minusDays(HISTORY_DAYS)))
                .filter(row -> row.getAmount() != null && row.getAmount().signum() > 0)
                .filter(row -> "expense".equalsIgnoreCase(row.getType()))
                .toList();
        List<Transaction> recent = history.stream()
                .filter(row -> !row.getDate().toLocalDate().isBefore(start))
                .sorted(Comparator.comparing(Transaction::getDate).thenComparing(Transaction::getId,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        Map<Long, List<FraudAlertReason>> reasonsByTransaction = new HashMap<>();
        Map<String, Transaction> firstByDuplicateKey = new HashMap<>();
        for (Transaction transaction : recent) {
            List<FraudAlertReason> reasons = new ArrayList<>();
            if (transaction.getAmount().compareTo(HIGH_AMOUNT_THRESHOLD) >= 0) {
                reasons.add(new FraudAlertReason("HIGH_AMOUNT",
                        "The expense meets the INR 50,000 high-amount review threshold."));
            }
            List<BigDecimal> categoryHistory = history.stream()
                    .filter(previous -> previous.getId() == null || !previous.getId().equals(transaction.getId()))
                    .filter(previous -> categoryKey(previous.getCategory()).equals(categoryKey(transaction.getCategory())))
                    .filter(previous -> previous.getDate().isBefore(transaction.getDate())
                            && !previous.getDate().isBefore(transaction.getDate().minusDays(90)))
                    .map(Transaction::getAmount).sorted().toList();
            if (categoryHistory.size() >= MIN_CATEGORY_HISTORY
                    && transaction.getAmount().compareTo(CATEGORY_SPIKE_MINIMUM) >= 0
                    && transaction.getAmount().compareTo(median(categoryHistory).multiply(CATEGORY_SPIKE_MULTIPLIER)) >= 0) {
                reasons.add(new FraudAlertReason("CATEGORY_SPIKE",
                        "The amount is at least three times the median of at least three earlier expenses in this category."));
            }
            String duplicateKey = duplicateKey(transaction);
            if (duplicateKey != null && firstByDuplicateKey.putIfAbsent(duplicateKey, transaction) != null) {
                reasons.add(new FraudAlertReason("POSSIBLE_DUPLICATE",
                        "Another same-day expense has the same amount and matching description, category, and payment method."));
            }
            if (!reasons.isEmpty()) reasonsByTransaction.put(transaction.getId(), reasons);
        }

        List<FraudAlert> alerts = recent.stream()
                .filter(transaction -> transaction.getId() != null && reasonsByTransaction.containsKey(transaction.getId()))
                .sorted(Comparator.comparing(Transaction::getDate).reversed())
                .limit(MAX_ALERTS)
                .map(transaction -> toAlert(transaction, reasonsByTransaction.get(transaction.getId())))
                .toList();
        for (FraudAlert alert : alerts) {
            notifications.insertIfAbsent(userId, "fraud-review:" + alert.transactionId(), "fraud_review",
                    "Transaction needs review", "A recorded transaction matched one or more review rules. Open Security & Fraud to review it.");
        }
        return new FraudAlertsResponse(start, today, alerts.size(), alerts, DISCLAIMER);
    }

    private static FraudAlert toAlert(Transaction transaction, List<FraudAlertReason> reasons) {
        String risk = reasons.size() >= 3 ? "HIGH" : reasons.size() == 2 ? "MEDIUM" : "LOW";
        return new FraudAlert(transaction.getId(), transaction.getDate(), transaction.getAmount(),
                transaction.getType(), transaction.getCategory(), transaction.getDescription(),
                transaction.getPaymentMethod(), risk, List.copyOf(reasons));
    }

    private static BigDecimal median(List<BigDecimal> sorted) {
        int middle = sorted.size() / 2;
        if (sorted.size() % 2 == 1) return sorted.get(middle);
        return sorted.get(middle - 1).add(sorted.get(middle)).divide(BigDecimal.valueOf(2));
    }

    private static String duplicateKey(Transaction transaction) {
        String description = normalize(transaction.getDescription());
        String paymentMethod = normalize(transaction.getPaymentMethod());
        if (description.isEmpty() && paymentMethod.isEmpty()) return null;
        return transaction.getDate().toLocalDate() + "|" + transaction.getAmount().stripTrailingZeros().toPlainString()
                + "|" + normalize(transaction.getType()) + "|" + categoryKey(transaction.getCategory())
                + "|" + description + "|" + paymentMethod;
    }

    private static String categoryKey(String category) {
        return normalize(category);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
