package com.upiq.financial.insights;

import com.upiq.budget.model.Budget;
import com.upiq.budget.repository.BudgetRepository;
import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.context.PeriodWindow;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinancialInsightsService {
    private static final String FALLBACK_EXPLANATION = "The figures and observations below are calculated from your recorded transactions.";
    private final TransactionRepository transactions;
    private final BudgetRepository budgets;
    private final SystemCService systemCService;

    @Transactional(readOnly = true)
    public FinancialInsightsResponse getInsights(Long userId) {
        YearMonth month = YearMonth.now();
        YearMonth previousMonth = month.minusMonths(1);
        LocalDate start = previousMonth.atDay(1);
        LocalDate nextMonth = month.plusMonths(1).atDay(1);
        List<Transaction> rows = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                start.atStartOfDay(), nextMonth.atStartOfDay().minusNanos(1));
        List<Transaction> currentRows = rows.stream().filter(t -> inMonth(t, month)).toList();
        List<Transaction> previousRows = rows.stream().filter(t -> inMonth(t, previousMonth)).toList();

        BigDecimal income = sum(currentRows, "income");
        BigDecimal expense = sum(currentRows, "expense");
        BigDecimal previousExpense = sum(previousRows, "expense");
        BigDecimal change = expense.subtract(previousExpense).setScale(2, RoundingMode.HALF_UP);
        BigDecimal changePercent = previousExpense.signum() == 0 ? null
                : change.multiply(BigDecimal.valueOf(100)).divide(previousExpense, 2, RoundingMode.HALF_UP);
        Map<String, BigDecimal> categoryTotals = categoryTotals(currentRows);
        List<CategorySpending> categoryBreakdown = categoryTotals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed().thenComparing(Map.Entry::getKey))
                .map(entry -> new CategorySpending(displayCategory(currentRows, entry.getKey()), scale(entry.getValue()),
                        expense.signum() == 0 ? BigDecimal.ZERO.setScale(2)
                                : entry.getValue().multiply(BigDecimal.valueOf(100)).divide(expense, 2, RoundingMode.HALF_UP),
                        countCategory(currentRows, entry.getKey())))
                .toList();
        CategorySpending top = categoryBreakdown.isEmpty() ? null : categoryBreakdown.get(0);

        List<BudgetInsight> budgetInsights = mapBudgetInsights(userId, month, currentRows);
        List<String> facts = deterministicFacts(month, previousMonth, income, expense, previousExpense,
                change, changePercent, categoryBreakdown, budgetInsights);
        boolean hasHistory = !currentRows.isEmpty() || !previousRows.isEmpty();
        String explanation = FALLBACK_EXPLANATION;
        boolean aiGenerated = false;
        if (hasHistory) {
            try {
                FinancialContext context = FinancialContext.builder()
                        .contextVersion(FinancialContext.CONTEXT_VERSION)
                        .source(FinancialContext.SOURCE)
                        .verified(true)
                        .calculationType("MONTHLY_INSIGHTS")
                        .transactionType("income_and_expense")
                        .period(PeriodWindow.builder().start(month.atDay(1)).end(month.atEndOfMonth()).build())
                        .facts(FinancialFacts.builder().totalIncome(income).totalExpense(expense)
                                .netBalance(income.subtract(expense))
                                .category1(top == null ? null : top.category())
                                .category1Total(top == null ? null : top.total())
                                .baselineTotal(previousExpense).currentTotal(expense)
                                .absoluteDifference(change.abs()).percentageDifference(changePercent)
                                .zeroDenominator(previousExpense.signum() == 0).increased(change.signum() > 0).build())
                        .definitions(Map.of(
                                "total_income", "verified sum of income transactions for the current calendar month",
                                "total_expense", "verified sum of expense transactions for the current calendar month",
                                "net_balance", "current-month income minus current-month expenses",
                                "baseline_total", "verified expense total from the previous calendar month",
                                "current_total", "verified expense total from the current calendar month",
                                "category1", "largest current-month expense category, if present",
                                "category1_total", "verified current-month total for category1, if present"))
                        .build();
                var response = systemCService.answer(
                        "Give a brief qualitative explanation of the verified month-over-month spending movement. "
                                + "Do not include digits, amounts, percentages, currency markers, or categories. "
                                + "Do not calculate or add financial facts; offer only a general review suggestion.", context);
                if (isSafeQualitativeExplanation(response == null ? null : response.getAnswer())) {
                    explanation = response.getAnswer().trim();
                    aiGenerated = true;
                }
            } catch (RuntimeException ignored) {
                // Deterministic facts remain available when Ollama is unavailable or returns unusable text.
            }
        }
        return FinancialInsightsResponse.builder().month(month).income(income).expenses(expense)
                .net(income.subtract(expense)).previousMonthExpenses(previousExpense)
                .expenseChange(change).expenseChangePercentage(changePercent)
                .topExpenseCategory(top == null ? null : top.category())
                .topExpenseCategoryTotal(top == null ? BigDecimal.ZERO.setScale(2) : top.total())
                .categoryBreakdown(categoryBreakdown).budgetInsights(budgetInsights)
                .insights(List.copyOf(facts)).explanation(explanation).aiGenerated(aiGenerated).build();
    }

    private List<BudgetInsight> mapBudgetInsights(Long userId, YearMonth month, List<Transaction> rows) {
        Map<String, BigDecimal> totals = categoryTotals(rows);
        BigDecimal allExpenses = sum(rows, "expense");
        return budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(userId, month.atDay(1)).stream().map(budget -> {
            BigDecimal spent = budget.getCategory() == null ? allExpenses
                    : totals.getOrDefault(categoryKey(budget.getCategory()), BigDecimal.ZERO);
            BigDecimal remaining = budget.getAmount().subtract(spent).setScale(2, RoundingMode.HALF_UP);
            BigDecimal utilization = spent.multiply(BigDecimal.valueOf(100))
                    .divide(budget.getAmount(), 2, RoundingMode.HALF_UP);
            return new BudgetInsight(budget.getCategory(), budget.getAmount(), scale(spent), remaining, utilization,
                    spent.compareTo(budget.getAmount()) > 0);
        }).toList();
    }

    private static List<String> deterministicFacts(YearMonth month, YearMonth previous, BigDecimal income,
            BigDecimal expense, BigDecimal previousExpense, BigDecimal change, BigDecimal changePercent,
            List<CategorySpending> categories, List<BudgetInsight> budgets) {
        List<String> facts = new ArrayList<>();
        facts.add("Recorded income for " + month + ": " + income.toPlainString() + ".");
        facts.add("Recorded expenses for " + month + ": " + expense.toPlainString() + ".");
        facts.add("Recorded expenses for " + previous + ": " + previousExpense.toPlainString() + ".");
        if (changePercent == null) facts.add("A percentage comparison is unavailable because the previous month had no recorded expenses.");
        else facts.add("Expense change from the previous month: " + change.toPlainString() + " (" + changePercent.toPlainString() + " percent).");
        if (categories.isEmpty()) facts.add("No expense category totals are recorded for the current month.");
        else facts.add("The category breakdown is ordered from highest to lowest recorded expense.");
        long overBudget = budgets.stream().filter(BudgetInsight::overBudget).count();
        if (overBudget > 0) facts.add(overBudget + " current-month budget limit(s) are exceeded.");
        else if (!budgets.isEmpty()) facts.add("No current-month budget limits are exceeded.");
        return facts;
    }

    private static Map<String, BigDecimal> categoryTotals(List<Transaction> rows) {
        Map<String, BigDecimal> totals = new HashMap<>();
        for (Transaction transaction : rows) {
            if (!isType(transaction, "expense") || transaction.getAmount() == null
                    || transaction.getAmount().signum() < 0) continue;
            totals.merge(categoryKey(transaction.getCategory()), transaction.getAmount(), BigDecimal::add);
        }
        return totals;
    }

    private static long countCategory(List<Transaction> rows, String category) {
        return rows.stream().filter(t -> isType(t, "expense")
                && categoryKey(t.getCategory()).equals(category)).count();
    }

    private static String displayCategory(List<Transaction> rows, String category) {
        return rows.stream().filter(t -> isType(t, "expense") && categoryKey(t.getCategory()).equals(category))
                .map(Transaction::getCategory).filter(value -> value != null && !value.isBlank())
                .map(String::trim).findFirst().orElse("Uncategorized");
    }

    private static BigDecimal sum(List<Transaction> rows, String type) {
        return rows.stream().filter(t -> isType(t, type)).map(t -> t.getAmount() == null ? BigDecimal.ZERO : t.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    private static boolean isType(Transaction transaction, String type) {
        return transaction.getType() != null && transaction.getType().equalsIgnoreCase(type);
    }

    private static boolean inMonth(Transaction transaction, YearMonth month) {
        return transaction.getDate() != null && month.equals(YearMonth.from(transaction.getDate()));
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String categoryKey(String category) {
        return category == null || category.isBlank() ? "uncategorized" : category.trim().toLowerCase(Locale.ROOT);
    }

    private static boolean isSafeQualitativeExplanation(String answer) {
        return answer != null && !answer.isBlank() && answer.length() <= 800
                && answer.matches("(?s)[^0-9₹$€£]*");
    }
}
