package com.upiq.financial.insights;

import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.context.PeriodWindow;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinancialInsightsService {
    private final TransactionRepository transactions;
    private final SystemCService systemCService;

    public FinancialInsightsResponse getInsights(Long userId) {
        YearMonth month = YearMonth.now();
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();
        List<Transaction> rows = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                start.atStartOfDay(), end.plusDays(1).atStartOfDay().minusNanos(1));
        BigDecimal income = sum(rows, "income");
        BigDecimal expense = sum(rows, "expense");
        Map<String, BigDecimal> categories = rows.stream()
                .filter(t -> isType(t, "expense"))
                .collect(Collectors.groupingBy(t -> t.getCategory() == null || t.getCategory().isBlank()
                                ? "Uncategorized" : t.getCategory().trim(),
                                Collectors.mapping(t -> amount(t.getAmount()),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
        Map.Entry<String, BigDecimal> top = categories.entrySet().stream()
                .sorted(Comparator.<Map.Entry<String, BigDecimal>, BigDecimal>comparing(Map.Entry::getValue)
                        .reversed().thenComparing(Map.Entry::getKey))
                .findFirst().orElse(null);
        List<String> facts = new java.util.ArrayList<>();
        facts.add("Recorded income this month: " + income.toPlainString() + ".");
        facts.add("Recorded expenses this month: " + expense.toPlainString() + ".");
        if (top != null) facts.add("Largest expense category: " + top.getKey() + " (" + top.getValue().toPlainString() + ").");
        if (rows.isEmpty()) facts.add("No income or expense transactions are recorded for this month.");

        String explanation = "AI explanation is unavailable; the figures and observations above are calculated from your recorded transactions.";
        boolean aiGenerated = false;
        if (!rows.isEmpty()) {
            try {
                FinancialContext context = FinancialContext.builder()
                        .contextVersion(FinancialContext.CONTEXT_VERSION)
                        .source(FinancialContext.SOURCE)
                        .verified(true)
                        .calculationType("MONTHLY_INSIGHTS")
                        .transactionType("income_and_expense")
                        .period(PeriodWindow.builder().start(start).end(end).build())
                        .facts(FinancialFacts.builder().totalIncome(income).totalExpense(expense)
                                .netBalance(income.subtract(expense))
                                .category1(top == null ? null : top.getKey())
                                .category1Total(top == null ? null : top.getValue()).build())
                        .definitions(Map.of(
                                "total_income", "verified sum of income transactions for the current calendar month",
                                "total_expense", "verified sum of expense transactions for the current calendar month",
                                "net_balance", "total_income minus total_expense",
                                "category1", "category with the greatest recorded expense total this month",
                                "category1_total", "sum of expenses assigned to category1 this month"))
                        .build();
                var response = systemCService.answer("Explain these verified monthly totals and the largest expense category briefly. Do not provide investment or personal financial advice.", context);
                if (response == null || response.getAnswer() == null || response.getAnswer().isBlank()) {
                    throw new IllegalStateException("AI explanation was empty");
                }
                explanation = response.getAnswer();
                aiGenerated = true;
            } catch (RuntimeException ignored) {
                // The deterministic calculations remain usable when Ollama is unavailable.
            }
        }
        return FinancialInsightsResponse.builder().month(month).income(income).expenses(expense)
                .net(income.subtract(expense)).topExpenseCategory(top == null ? null : top.getKey())
                .topExpenseCategoryTotal(top == null ? BigDecimal.ZERO : top.getValue())
                .insights(List.copyOf(facts)).explanation(explanation).aiGenerated(aiGenerated).build();
    }

    private static BigDecimal sum(List<Transaction> rows, String type) {
        return rows.stream().filter(t -> isType(t, type)).map(t -> amount(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }
    private static boolean isType(Transaction t, String type) { return t.getType() != null && t.getType().equalsIgnoreCase(type); }
    private static BigDecimal amount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
