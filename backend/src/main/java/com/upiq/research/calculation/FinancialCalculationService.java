package com.upiq.research.calculation;

import com.upiq.research.calculation.dto.*;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Deterministic financial calculation engine for UPIQ 2.0 Paper 1 research.
 *
 * <h2>Precision boundary</h2>
 * <p>The {@code Transaction} entity stores {@code amount} as {@code Double} (IEEE 754 double-precision
 * floating point). This service converts each {@code Double} to {@code BigDecimal} via
 * {@link BigDecimal#valueOf(double)} — <strong>not</strong> {@code new BigDecimal(double)} — so that
 * the conversion uses the canonical decimal string representation of the double, minimising
 * accumulated binary floating-point artefacts (e.g. 0.1 + 0.2 = 0.30000000000000004 is avoided).
 *
 * <p>All arithmetic is performed with {@link MathContext#DECIMAL128} precision and results are
 * rounded to 2 decimal places using {@link RoundingMode#HALF_UP} before being stored in result DTOs.
 *
 * <p>Known limitation: amounts that cannot be exactly represented in IEEE 754 double (e.g. recurring
 * fractions) may carry a small representational error introduced at database insertion time. This
 * engine does not introduce additional error beyond that boundary.
 *
 * <h2>Type conventions</h2>
 * <ul>
 *   <li>Income transactions have {@code type = "income"} (case-insensitive).</li>
 *   <li>Expense transactions have {@code type = "expense"} (case-insensitive).</li>
 * </ul>
 *
 * <h2>Date boundaries</h2>
 * <p>The {@code endDate} is always treated as inclusive to the last nanosecond of that day.
 * {@link PeriodRange#of} handles this normalisation automatically.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialCalculationService {

    private static final String TYPE_INCOME = "income";
    private static final String TYPE_EXPENSE = "expense";
    private static final MathContext MC = MathContext.DECIMAL128;
    private static final int RESULT_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final TransactionRepository transactionRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Total Income
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sum of all income transactions for the given user within the period.
     *
     * <p>Formula: {@code Σ amount where type = "income"}
     */
    public BigDecimal calculateTotalIncome(Long userId, PeriodRange period) {
        List<Transaction> txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, TYPE_INCOME, period.getStartDate(), period.getEndDate());
        BigDecimal total = sumAmounts(txns);
        log.debug("Calculated income aggregate");
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Total Expense
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sum of all expense transactions for the given user within the period.
     *
     * <p>Formula: {@code Σ amount where type = "expense"}
     */
    public BigDecimal calculateTotalExpense(Long userId, PeriodRange period) {
        List<Transaction> txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, TYPE_EXPENSE, period.getStartDate(), period.getEndDate());
        BigDecimal total = sumAmounts(txns);
        log.debug("Calculated expense aggregate");
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Net Balance
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Net balance and savings rate for the given user and period.
     *
     * <p>Formulas:
     * <pre>
     *   netBalance  = totalIncome - totalExpense
     *   savingsRate = (netBalance / totalIncome) × 100    [undefined if totalIncome = 0]
     * </pre>
     */
    public NetBalanceResult calculateNetBalance(Long userId, PeriodRange period) {
        List<Transaction> incomeTxns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, TYPE_INCOME, period.getStartDate(), period.getEndDate());
        List<Transaction> expenseTxns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, TYPE_EXPENSE, period.getStartDate(), period.getEndDate());

        BigDecimal totalIncome = sumAmounts(incomeTxns);
        BigDecimal totalExpense = sumAmounts(expenseTxns);
        BigDecimal netBalance = totalIncome.subtract(totalExpense, MC).setScale(RESULT_SCALE, ROUNDING);

        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netBalance.divide(totalIncome, MC)
                    .multiply(BigDecimal.valueOf(100), MC)
                    .setScale(RESULT_SCALE, ROUNDING);
        }

        return NetBalanceResult.builder()
                .userId(userId)
                .period(period)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netBalance(netBalance)
                .savingsRate(savingsRate)
                .incomeTransactionCount(incomeTxns.size())
                .expenseTransactionCount(expenseTxns.size())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Category Total
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Total amount for a specific category and transaction type within the period.
     *
     * <p>When {@code transactionType} is {@code "expense"} the
     * {@code percentageOfTotalExpense} field is populated:
     * <pre>
     *   percentageOfTotalExpense = (categoryTotal / totalExpense) × 100
     * </pre>
     * For income categories this field is null.
     */
    public CategoryTotalResult calculateCategoryTotal(Long userId, String category,
                                                      String transactionType, PeriodRange period) {
        List<Transaction> txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, transactionType, category, period.getStartDate(), period.getEndDate());
        BigDecimal total = sumAmounts(txns);

        BigDecimal percentageOfTotalExpense = null;
        if (TYPE_EXPENSE.equalsIgnoreCase(transactionType)) {
            percentageOfTotalExpense = calculateCategoryPercentage(userId, category, period);
        }

        return CategoryTotalResult.builder()
                .userId(userId)
                .category(category)
                .transactionType(transactionType)
                .period(period)
                .total(total)
                .transactionCount(txns.size())
                .percentageOfTotalExpense(percentageOfTotalExpense)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Category Percentage
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Percentage that a given expense category contributes to total expenses.
     *
     * <p>Formula:
     * <pre>
     *   categoryPercentage = (categoryExpenseTotal / totalExpense) × 100
     * </pre>
     * Returns {@link BigDecimal#ZERO} when totalExpense is zero (safe division).
     */
    public BigDecimal calculateCategoryPercentage(Long userId, String category, PeriodRange period) {
        List<Transaction> categoryTxns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, TYPE_EXPENSE, category, period.getStartDate(), period.getEndDate());
        BigDecimal categoryTotal = sumAmounts(categoryTxns);

        List<Transaction> allExpenseTxns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, TYPE_EXPENSE, period.getStartDate(), period.getEndDate());
        BigDecimal totalExpense = sumAmounts(allExpenseTxns);

        if (totalExpense.compareTo(BigDecimal.ZERO) == 0) {
            log.debug("calculateCategoryPercentage: totalExpense is 0, returning 0");
            return BigDecimal.ZERO;
        }

        return categoryTotal.divide(totalExpense, MC)
                .multiply(BigDecimal.valueOf(100), MC)
                .setScale(RESULT_SCALE, ROUNDING);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Period Comparison
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compare total income or expense across two consecutive periods.
     *
     * <p>Period 1 is the <em>baseline</em>; period 2 is the <em>current</em>.
     *
     * <p>Formulas:
     * <pre>
     *   absoluteDifference  = period2Total - period1Total
     *   percentageDifference = ((period2Total - period1Total) / period1Total) × 100
     * </pre>
     * A positive {@code absoluteDifference} means period 2 had more than period 1.
     * Returns {@code zeroDenominator=true} when period1Total is zero.
     */
    public PeriodComparisonResult comparePeriods(Long userId, PeriodRange period1,
                                                 PeriodRange period2, String transactionType) {
        List<Transaction> p1Txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, transactionType, period1.getStartDate(), period1.getEndDate());
        List<Transaction> p2Txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, transactionType, period2.getStartDate(), period2.getEndDate());

        BigDecimal p1Total = sumAmounts(p1Txns);
        BigDecimal p2Total = sumAmounts(p2Txns);
        BigDecimal absoluteDiff = p2Total.subtract(p1Total, MC).setScale(RESULT_SCALE, ROUNDING);

        boolean zeroDenominator = p1Total.compareTo(BigDecimal.ZERO) == 0;
        BigDecimal percentageDiff = null;
        if (!zeroDenominator) {
            percentageDiff = absoluteDiff.divide(p1Total, MC)
                    .multiply(BigDecimal.valueOf(100), MC)
                    .setScale(RESULT_SCALE, ROUNDING);
        }

        return PeriodComparisonResult.builder()
                .userId(userId)
                .transactionType(transactionType)
                .period1(period1)
                .period2(period2)
                .period1Total(p1Total)
                .period2Total(p2Total)
                .absoluteDifference(absoluteDiff)
                .percentageDifference(percentageDiff)
                .zeroDenominator(zeroDenominator)
                .period1TransactionCount(p1Txns.size())
                .period2TransactionCount(p2Txns.size())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Category Comparison
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compare two categories over the same period and transaction type.
     *
     * <p>Formulas:
     * <pre>
     *   absoluteDifference  = category1Total - category2Total
     *   percentageDifference = ((category1Total - category2Total) / category2Total) × 100
     * </pre>
     * A positive result means category 1 had more spend than category 2.
     * Returns {@code zeroDenominator=true} when category2Total is zero.
     */
    public CategoryComparisonResult compareCategories(Long userId, String category1,
                                                      String category2, String transactionType,
                                                      PeriodRange period) {
        List<Transaction> cat1Txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, transactionType, category1, period.getStartDate(), period.getEndDate());
        List<Transaction> cat2Txns = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                        userId, transactionType, category2, period.getStartDate(), period.getEndDate());

        BigDecimal cat1Total = sumAmounts(cat1Txns);
        BigDecimal cat2Total = sumAmounts(cat2Txns);
        BigDecimal absoluteDiff = cat1Total.subtract(cat2Total, MC).setScale(RESULT_SCALE, ROUNDING);

        boolean zeroDenominator = cat2Total.compareTo(BigDecimal.ZERO) == 0;
        BigDecimal percentageDiff = null;
        if (!zeroDenominator) {
            percentageDiff = absoluteDiff.divide(cat2Total, MC)
                    .multiply(BigDecimal.valueOf(100), MC)
                    .setScale(RESULT_SCALE, ROUNDING);
        }

        String higherCategory = cat1Total.compareTo(cat2Total) >= 0 ? category1 : category2;

        return CategoryComparisonResult.builder()
                .userId(userId)
                .transactionType(transactionType)
                .period(period)
                .category1(category1)
                .category1Total(cat1Total)
                .category1TransactionCount(cat1Txns.size())
                .category2(category2)
                .category2Total(cat2Total)
                .category2TransactionCount(cat2Txns.size())
                .absoluteDifference(absoluteDiff)
                .percentageDifference(percentageDiff)
                .zeroDenominator(zeroDenominator)
                .higherCategory(higherCategory)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Top N Transactions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Return the top {@code limit} transactions by amount in descending order.
     *
     * <p>When {@code transactionType} is null or blank, all transaction types are included.
     *
     * @param limit Maximum number of results; must be &ge; 1.
     */
    public List<TopTransactionEntry> findTopTransactions(Long userId, PeriodRange period,
                                                         String transactionType, int limit) {
        if (limit < 1) {
            throw new IllegalArgumentException("limit must be >= 1, got " + limit);
        }

        List<Transaction> txns;
        if (transactionType == null || transactionType.isBlank()) {
            txns = transactionRepository.findByUserIdAndDateBetweenOrderByAmountDesc(
                    userId, period.getStartDate(), period.getEndDate());
        } else {
            txns = transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    userId, transactionType, period.getStartDate(), period.getEndDate());
        }

        List<TopTransactionEntry> results = new ArrayList<>();
        int count = Math.min(limit, txns.size());
        for (int i = 0; i < count; i++) {
            Transaction t = txns.get(i);
            results.add(TopTransactionEntry.builder()
                    .transactionId(t.getId())
                    .userId(t.getUserId())
                    .amount(toBigDecimal(t.getAmount()))
                    .type(t.getType())
                    .category(t.getCategory())
                    .description(t.getDescription())
                    .date(t.getDate())
                    .paymentMethod(t.getPaymentMethod())
                    .rank(i + 1)
                    .build());
        }
        return results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Spending Concentration
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Spending concentration — what percentage of total expenditure is captured by the
     * top {@code topN} individual expense transactions.
     *
     * <p>Formula:
     * <pre>
     *   topNAmount            = sum(top-N expense transactions by amount)
     *   concentrationPercent  = (topNAmount / totalExpense) × 100
     * </pre>
     *
     * <p>This is a simple, research-friendly measure of expenditure skew: a high value means
     * that spending is dominated by a few large transactions; a low value means spending is
     * spread evenly across many transactions.
     *
     * <p>Returns {@code concentrationPercentage = 0} and {@code zeroDenominator = true}
     * when totalExpense is zero.
     *
     * @param topN The number of largest expense transactions to consider; must be &ge; 1.
     */
    public SpendingConcentrationResult calculateSpendingConcentration(Long userId, PeriodRange period,
                                                                      int topN) {
        if (topN < 1) {
            throw new IllegalArgumentException("topN must be >= 1, got " + topN);
        }

        List<Transaction> allExpense = transactionRepository
                .findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                        userId, TYPE_EXPENSE, period.getStartDate(), period.getEndDate());

        BigDecimal totalExpense = sumAmounts(allExpense);

        List<TopTransactionEntry> topTransactions = new ArrayList<>();
        int count = Math.min(topN, allExpense.size());
        for (int i = 0; i < count; i++) {
            Transaction t = allExpense.get(i);
            topTransactions.add(TopTransactionEntry.builder()
                    .transactionId(t.getId())
                    .userId(t.getUserId())
                    .amount(toBigDecimal(t.getAmount()))
                    .type(t.getType())
                    .category(t.getCategory())
                    .description(t.getDescription())
                    .date(t.getDate())
                    .paymentMethod(t.getPaymentMethod())
                    .rank(i + 1)
                    .build());
        }

        BigDecimal topNAmount = topTransactions.stream()
                .map(TopTransactionEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(RESULT_SCALE, ROUNDING);

        boolean zeroDenominator = totalExpense.compareTo(BigDecimal.ZERO) == 0;
        BigDecimal concentrationPercentage = BigDecimal.ZERO;
        if (!zeroDenominator) {
            concentrationPercentage = topNAmount.divide(totalExpense, MC)
                    .multiply(BigDecimal.valueOf(100), MC)
                    .setScale(RESULT_SCALE, ROUNDING);
        }

        return SpendingConcentrationResult.builder()
                .userId(userId)
                .period(period)
                .topN(topN)
                .totalExpense(totalExpense)
                .topNAmount(topNAmount)
                .concentrationPercentage(concentrationPercentage)
                .zeroDenominator(zeroDenominator)
                .topTransactions(topTransactions)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal utilities
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Converts a nullable {@code Double} to {@code BigDecimal} using the canonical decimal string
     * representation via {@link BigDecimal#valueOf(double)}.
     * Null or NaN inputs return {@link BigDecimal#ZERO}.
     */
    static BigDecimal toBigDecimal(Double amount) {
        if (amount == null || amount.isNaN() || amount.isInfinite()) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(amount);
    }

    /**
     * Sum the amounts in a list of transactions converting each via {@link #toBigDecimal(Double)}.
     * Returns a result rounded to {@value #RESULT_SCALE} decimal places.
     */
    private BigDecimal sumAmounts(List<Transaction> transactions) {
        return transactions.stream()
                .map(t -> toBigDecimal(t.getAmount()))
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b, MC))
                .setScale(RESULT_SCALE, ROUNDING);
    }
}
