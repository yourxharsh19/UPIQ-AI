package com.upiq.budget.service;

import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import com.upiq.budget.dto.BudgetRequest;
import com.upiq.budget.dto.BudgetResponse;
import com.upiq.budget.exceptions.BudgetConflictException;
import com.upiq.budget.exceptions.BudgetNotFoundException;
import com.upiq.budget.model.Budget;
import com.upiq.budget.repository.BudgetRepository;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgets;
    private final TransactionRepository transactions;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Long userId, String monthText) {
        YearMonth month = parseMonth(monthText);
        return mapBudgets(userId, month, budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(userId, month.atDay(1)));
    }

    @Transactional
    public BudgetResponse create(Long userId, BudgetRequest request) {
        YearMonth month = parseMonth(request.getMonth());
        String category = normalizeCategory(request.getCategory());
        if (budgets.findForUserAndPeriodAndCategory(userId, month.atDay(1), category).isPresent()) {
            throw new BudgetConflictException();
        }
        User user = users.findById(userId).orElseThrow(BudgetNotFoundException::new);
        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setPeriodStart(month.atDay(1));
        budget.setAmount(request.getAmount().setScale(2, RoundingMode.UNNECESSARY));
        return saveAndMap(userId, month, budget);
    }

    @Transactional
    public BudgetResponse update(Long userId, Long budgetId, BudgetRequest request) {
        Budget budget = budgets.findByIdAndUser_Id(budgetId, userId).orElseThrow(BudgetNotFoundException::new);
        YearMonth month = parseMonth(request.getMonth());
        String category = normalizeCategory(request.getCategory());
        budgets.findForUserAndPeriodAndCategory(userId, month.atDay(1), category)
                .filter(existing -> !existing.getId().equals(budgetId))
                .ifPresent(existing -> { throw new BudgetConflictException(); });
        budget.setCategory(category);
        budget.setPeriodStart(month.atDay(1));
        budget.setAmount(request.getAmount().setScale(2, RoundingMode.UNNECESSARY));
        return saveAndMap(userId, month, budget);
    }

    @Transactional
    public void delete(Long userId, Long budgetId) {
        Budget budget = budgets.findByIdAndUser_Id(budgetId, userId).orElseThrow(BudgetNotFoundException::new);
        budgets.delete(budget);
    }

    private BudgetResponse saveAndMap(Long userId, YearMonth month, Budget budget) {
        try {
            Budget saved = budgets.saveAndFlush(budget);
            List<Budget> rows = budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(userId, month.atDay(1));
            return mapBudgets(userId, month, rows).stream()
                    .filter(item -> item.id().equals(saved.getId())).findFirst().orElseThrow();
        } catch (DataIntegrityViolationException ex) {
            throw new BudgetConflictException();
        }
    }

    private List<BudgetResponse> mapBudgets(Long userId, YearMonth month, List<Budget> rows) {
        LocalDate start = month.atDay(1);
        LocalDate next = month.plusMonths(1).atDay(1);
        List<Transaction> ledger = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                start.atStartOfDay(), next.atStartOfDay().minusNanos(1));
        Map<String, BigDecimal> categoryTotals = new HashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Transaction transaction : ledger) {
            if (transaction.getUserId() == null || !transaction.getUserId().equals(userId)
                    || transaction.getType() == null || !transaction.getType().equalsIgnoreCase("expense")
                    || transaction.getAmount() == null || transaction.getAmount().signum() < 0) continue;
            BigDecimal amount = transaction.getAmount();
            total = total.add(amount);
            categoryTotals.merge(categoryKey(transaction.getCategory()), amount, BigDecimal::add);
        }
        BigDecimal allExpenses = total;
        YearMonth current = YearMonth.now();
        int elapsedDays = month.equals(current) ? LocalDate.now().getDayOfMonth() : month.lengthOfMonth();
        return rows.stream().sorted(Comparator.comparing(Budget::getCategory,
                        Comparator.nullsFirst(String.CASE_INSENSITIVE_ORDER)))
                .map(budget -> {
                    BigDecimal spent = budget.getCategory() == null ? allExpenses
                            : categoryTotals.getOrDefault(categoryKey(budget.getCategory()), BigDecimal.ZERO);
                    BigDecimal remaining = budget.getAmount().subtract(spent).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal percentage = spent.multiply(BigDecimal.valueOf(100))
                            .divide(budget.getAmount(), 2, RoundingMode.HALF_UP);
                    BigDecimal projected = month.isAfter(current) ? BigDecimal.ZERO.setScale(2)
                            : month.equals(current)
                                    ? spent.multiply(BigDecimal.valueOf(month.lengthOfMonth()))
                                            .divide(BigDecimal.valueOf(Math.max(1, elapsedDays)), 2, RoundingMode.HALF_UP)
                                    : spent.setScale(2, RoundingMode.HALF_UP);
                    return new BudgetResponse(budget.getId(), budget.getCategory(), budget.getPeriodStart(),
                            budget.getAmount(), spent.setScale(2, RoundingMode.HALF_UP), remaining,
                            projected, percentage, spent.compareTo(budget.getAmount()) > 0);
                }).toList();
    }

    private static YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) return YearMonth.now();
        try {
            return YearMonth.parse(month);
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Month must use YYYY-MM format");
        }
    }

    private static String normalizeCategory(String category) {
        return category == null || category.isBlank() ? null : category.trim();
    }

    private static String categoryKey(String category) {
        return category == null || category.isBlank() ? "uncategorized" : category.trim().toLowerCase(Locale.ROOT);
    }
}
