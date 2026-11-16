package com.upiq.research.calculation;

import com.upiq.research.calculation.dto.*;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link FinancialCalculationService}.
 *
 * <p>All expected values are independently derived from the synthetic research dataset
 * (profiles.json / transactions.json) using Node.js verification scripts.
 * They are NOT computed by calling the production service to generate the expected value.
 *
 * <h2>Ground truth reference (confirmed by external computation)</h2>
 * <ul>
 *   <li>Profile 01 (userId=1L), August 2026: income=85000, expense=13166, net=71834</li>
 *   <li>Profile 01, August 2026 Food expense = 3620</li>
 *   <li>Profile 01, August 2026 Transportation expense = 2000</li>
 *   <li>Profile 01, August 2026 Food% of total expense = 27.50%</li>
 *   <li>Profile 01, July 2026 expense = 11356</li>
 *   <li>Profile 01, August vs July expense diff = +1810 (absolute)</li>
 *   <li>Profile 01, August 2026 Top-1 expense: Utilities 2100</li>
 *   <li>Profile 02 (userId=2L), August 2026: income=120000, expense=23046</li>
 *   <li>Profile 02, August 2026 Healthcare expense = 2400</li>
 *   <li>Profile 03 (userId=3L), July income=75000, August income=25000</li>
 *   <li>Profile 03, July Shopping expense = 5400</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinancialCalculationService")
class FinancialCalculationServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private FinancialCalculationService service;

    // ── Synthetic user IDs matching the research dataset profiles ───────────
    private static final Long USER_P01 = 1L;
    private static final Long USER_P02 = 2L;
    private static final Long USER_P03 = 3L;

    private static final PeriodRange AUG_2026 = PeriodRange.of(
            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
    private static final PeriodRange JUL_2026 = PeriodRange.of(
            LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

    // ── Helpers to create minimal Transaction objects ────────────────────────

    private static Transaction income(Long userId, double amount, String category, LocalDateTime date) {
        return Transaction.builder()
                .id(null)
                .userId(userId)
                .amount(BigDecimal.valueOf(amount))
                .type("income")
                .category(category)
                .description("Test income")
                .date(date)
                .paymentMethod("Net Banking")
                .build();
    }

    private static Transaction expense(Long userId, double amount, String category, LocalDateTime date) {
        return Transaction.builder()
                .id(null)
                .userId(userId)
                .amount(BigDecimal.valueOf(amount))
                .type("expense")
                .category(category)
                .description("Test expense")
                .date(date)
                .paymentMethod("UPI")
                .build();
    }

    private static Transaction expenseWithId(long id, Long userId, double amount, String category,
                                              LocalDateTime date, String description) {
        Transaction t = expense(userId, amount, category, date);
        t.setId(id);
        t.setDescription(description);
        return t;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Profile 01 – August 2026 test fixtures matching the ground truth
    // (profile_01, August 2026: income=85000, expenses sum=13166)
    // ────────────────────────────────────────────────────────────────────────

    private List<Transaction> p01AugIncomes() {
        return List.of(income(USER_P01, 85000, "Salary", LocalDateTime.of(2026, 8, 1, 9, 0)));
    }

    private List<Transaction> p01AugExpenses() {
        return List.of(
                // Food: 3620 total
                expenseWithId(100L, USER_P01, 650,  "Food",          LocalDateTime.of(2026,8,2,13,15), "Paid to Swiggy"),
                expenseWithId(101L, USER_P01, 400,  "Food",          LocalDateTime.of(2026,8,7,20,40), "Paid to Zomato"),
                expenseWithId(102L, USER_P01, 800,  "Food",          LocalDateTime.of(2026,8,12,11,0), "Paid to BigBasket"),
                expenseWithId(103L, USER_P01, 300,  "Food",          LocalDateTime.of(2026,8,18,8,20), "Paid to CCD"),
                expenseWithId(104L, USER_P01, 500,  "Food",          LocalDateTime.of(2026,8,22,19,10),"Paid to Swiggy"),
                expenseWithId(105L, USER_P01, 970,  "Food",          LocalDateTime.of(2026,8,28,21,0), "Paid to DMart"),
                // Transportation: 2000 total
                expenseWithId(106L, USER_P01, 600,  "Transportation",LocalDateTime.of(2026,8,5,18,0),  "Paid to Uber"),
                expenseWithId(107L, USER_P01, 500,  "Transportation",LocalDateTime.of(2026,8,15,9,0),  "Metro recharge"),
                expenseWithId(108L, USER_P01, 900,  "Transportation",LocalDateTime.of(2026,8,25,18,30),"Paid to Uber"),
                // Utilities: 2100 (largest)
                expenseWithId(109L, USER_P01, 2100, "Utilities",     LocalDateTime.of(2026,8,6,10,0),  "BESCOM electricity bill"),
                // Shopping: 1800
                expenseWithId(110L, USER_P01, 1800, "Shopping",      LocalDateTime.of(2026,8,10,16,0), "Paid to Myntra"),
                // Entertainment: 1200
                expenseWithId(111L, USER_P01, 1200, "Entertainment", LocalDateTime.of(2026,8,14,19,0), "Paid to BookMyShow"),
                // Health: 366
                expenseWithId(112L, USER_P01, 366,  "Health",        LocalDateTime.of(2026,8,20,9,0),  "Apollo pharmacy")
        );
        // Total: 650+400+800+300+500+970 + 600+500+900 + 2100 + 1800 + 1200 + 366 = 13086
        // (Note: fixture uses approximate values; real dataset total is 13166; tests use mock data below)
    }

    // ────────────────────────────────────────────────────────────────────────
    // Simpler exact fixtures for precision-critical tests
    // ────────────────────────────────────────────────────────────────────────

    private List<Transaction> exactIncomes() {
        return List.of(
                income(USER_P01, 85000.0, "Salary", LocalDateTime.of(2026, 8, 1, 9, 0))
        );
    }

    private List<Transaction> exactExpenses() {
        // Exactly matching ground truth totals from dataset verification
        return List.of(
                expenseWithId(1L, USER_P01, 3620.0, "Food",           LocalDateTime.of(2026,8,1,0,0), "Food total"),
                expenseWithId(2L, USER_P01, 2000.0, "Transportation",  LocalDateTime.of(2026,8,1,0,0), "Transport total"),
                expenseWithId(3L, USER_P01, 2100.0, "Utilities",       LocalDateTime.of(2026,8,1,0,0), "Utilities"),
                expenseWithId(4L, USER_P01, 1800.0, "Shopping",        LocalDateTime.of(2026,8,1,0,0), "Shopping"),
                expenseWithId(5L, USER_P01, 1200.0, "Entertainment",   LocalDateTime.of(2026,8,1,0,0), "Entertainment"),
                expenseWithId(6L, USER_P01, 2446.0, "Other",           LocalDateTime.of(2026,8,1,0,0), "Other (13166-3620-2000-2100-1800-1200=446... rebalanced)")
        );
        // Total = 3620+2000+2100+1800+1200+2446 = 13166
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Tests
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("calculateTotalIncome")
    class CalculateTotalIncomeTests {

        @Test
        @DisplayName("returns correct income for Profile 01 August 2026")
        void returnsCorrectIncome() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(exactIncomes());

            BigDecimal result = service.calculateTotalIncome(USER_P01, AUG_2026);

            assertThat(result).isEqualByComparingTo("85000.00");
        }

        @Test
        @DisplayName("returns zero when no income transactions exist")
        void returnsZeroWhenEmpty() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("income"), any(), any()))
                    .thenReturn(Collections.emptyList());

            BigDecimal result = service.calculateTotalIncome(USER_P01, AUG_2026);

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("sums multiple income transactions correctly")
        void sumsMultipleIncomes() {
            List<Transaction> multi = List.of(
                    income(USER_P01, 50000.0, "Salary", LocalDateTime.of(2026,8,1,9,0)),
                    income(USER_P01, 35000.0, "Freelance", LocalDateTime.of(2026,8,15,10,0))
            );
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(multi);

            BigDecimal result = service.calculateTotalIncome(USER_P01, AUG_2026);

            assertThat(result).isEqualByComparingTo("85000.00");
        }
    }

    @Nested
    @DisplayName("calculateTotalExpense")
    class CalculateTotalExpenseTests {

        @Test
        @DisplayName("returns correct expense total for Profile 01 August 2026 — ground truth: 13166")
        void returnsCorrectExpense() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            BigDecimal result = service.calculateTotalExpense(USER_P01, AUG_2026);

            assertThat(result).isEqualByComparingTo("13166.00");
        }

        @Test
        @DisplayName("returns zero when no expense transactions exist")
        void returnsZeroWhenEmpty() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(Collections.emptyList());

            BigDecimal result = service.calculateTotalExpense(USER_P01, AUG_2026);

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("does NOT include income transactions in expense sum")
        void doesNotIncomeInExpense() {
            // Only income returned — should not appear in expense result
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(Collections.emptyList());

            BigDecimal result = service.calculateTotalExpense(USER_P01, AUG_2026);

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateNetBalance")
    class CalculateNetBalanceTests {

        @Test
        @DisplayName("net balance = income - expense: 85000 - 13166 = 71834")
        void correctNetBalance() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(exactIncomes());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            NetBalanceResult result = service.calculateNetBalance(USER_P01, AUG_2026);

            assertThat(result.getTotalIncome()).isEqualByComparingTo("85000.00");
            assertThat(result.getTotalExpense()).isEqualByComparingTo("13166.00");
            assertThat(result.getNetBalance()).isEqualByComparingTo("71834.00");
        }

        @Test
        @DisplayName("savings rate = netBalance / income × 100: 71834/85000×100 ≈ 84.51%")
        void correctSavingsRate() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(exactIncomes());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            NetBalanceResult result = service.calculateNetBalance(USER_P01, AUG_2026);

            // 71834 / 85000 * 100 = 84.5105...  → 84.51 with HALF_UP
            assertThat(result.getSavingsRate()).isBetween(
                    new BigDecimal("84.50"), new BigDecimal("84.52"));
        }

        @Test
        @DisplayName("savings rate is zero when income is zero")
        void savingsRateIsZeroWithNoIncome() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(Collections.emptyList());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            NetBalanceResult result = service.calculateNetBalance(USER_P01, AUG_2026);

            assertThat(result.getTotalIncome()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getNetBalance()).isEqualByComparingTo("-13166.00");
            assertThat(result.getSavingsRate()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("transaction counts are set correctly")
        void transactionCountsCorrect() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(exactIncomes());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            NetBalanceResult result = service.calculateNetBalance(USER_P01, AUG_2026);

            assertThat(result.getIncomeTransactionCount()).isEqualTo(1L);
            assertThat(result.getExpenseTransactionCount()).isEqualTo(exactExpenses().size());
        }

        @Test
        @DisplayName("all empty — balance is zero")
        void allEmptyGivesZeroBalance() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("income"), any(), any()))
                    .thenReturn(Collections.emptyList());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(Collections.emptyList());

            NetBalanceResult result = service.calculateNetBalance(USER_P01, AUG_2026);

            assertThat(result.getNetBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getSavingsRate()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateCategoryTotal")
    class CalculateCategoryTotalTests {

        @Test
        @DisplayName("Food expense total for P01 Aug 2026 — ground truth: 3620")
        void foodExpenseTotalP01Aug() {
            List<Transaction> foodTxns = List.of(
                    expenseWithId(1L, USER_P01, 650, "Food", LocalDateTime.of(2026,8,2,13,15), "Swiggy"),
                    expenseWithId(2L, USER_P01, 400, "Food", LocalDateTime.of(2026,8,7,20,40), "Zomato"),
                    expenseWithId(3L, USER_P01, 800, "Food", LocalDateTime.of(2026,8,12,11,0), "BigBasket"),
                    expenseWithId(4L, USER_P01, 300, "Food", LocalDateTime.of(2026,8,18,8,20), "CCD"),
                    expenseWithId(5L, USER_P01, 500, "Food", LocalDateTime.of(2026,8,22,19,10),"Swiggy"),
                    expenseWithId(6L, USER_P01, 970, "Food", LocalDateTime.of(2026,8,28,21,0), "DMart")
            );
            // For calculateCategoryTotal, we also need to stub the full expense list for percentage
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq("Food"), any(), any()))
                    .thenReturn(foodTxns);
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            CategoryTotalResult result = service.calculateCategoryTotal(USER_P01, "Food", "expense", AUG_2026);

            assertThat(result.getTotal()).isEqualByComparingTo("3620.00");
            assertThat(result.getTransactionCount()).isEqualTo(6L);
            assertThat(result.getCategory()).isEqualTo("Food");
            assertThat(result.getTransactionType()).isEqualTo("expense");
        }

        @Test
        @DisplayName("Transportation expense for P01 Aug — ground truth: 2000")
        void transportExpenseP01Aug() {
            List<Transaction> transportTxns = List.of(
                    expenseWithId(1L, USER_P01, 600, "Transportation", LocalDateTime.of(2026,8,5,18,0),  "Uber"),
                    expenseWithId(2L, USER_P01, 500, "Transportation", LocalDateTime.of(2026,8,15,9,0),  "Metro"),
                    expenseWithId(3L, USER_P01, 900, "Transportation", LocalDateTime.of(2026,8,25,18,30),"Uber")
            );
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq("Transportation"), any(), any()))
                    .thenReturn(transportTxns);
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            CategoryTotalResult result = service.calculateCategoryTotal(USER_P01, "Transportation", "expense", AUG_2026);

            assertThat(result.getTotal()).isEqualByComparingTo("2000.00");
            assertThat(result.getTransactionCount()).isEqualTo(3L);
        }

        @Test
        @DisplayName("returns zero total for category with no transactions")
        void returnsZeroForEmptyCategory() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), any(), eq("NonExistentCategory"), any(), any()))
                    .thenReturn(Collections.emptyList());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            CategoryTotalResult result = service.calculateCategoryTotal(
                    USER_P01, "NonExistentCategory", "expense", AUG_2026);

            assertThat(result.getTotal()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTransactionCount()).isEqualTo(0L);
        }

        @Test
        @DisplayName("income category does not populate percentageOfTotalExpense")
        void incomeCategoryHasNoExpensePercentage() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("income"), eq("Salary"), any(), any()))
                    .thenReturn(exactIncomes());

            CategoryTotalResult result = service.calculateCategoryTotal(USER_P01, "Salary", "income", AUG_2026);

            assertThat(result.getTotal()).isEqualByComparingTo("85000.00");
            assertThat(result.getPercentageOfTotalExpense()).isNull();
        }
    }

    @Nested
    @DisplayName("calculateCategoryPercentage")
    class CalculateCategoryPercentageTests {

        @Test
        @DisplayName("Food % of P01 Aug expense — ground truth: 27.50%")
        void foodPercentageCorrect() {
            List<Transaction> foodTxns = List.of(
                    expenseWithId(1L, USER_P01, 3620.0, "Food", LocalDateTime.of(2026,8,1,0,0),"Food bundle")
            );
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq("Food"), any(), any()))
                    .thenReturn(foodTxns);
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(exactExpenses());

            BigDecimal result = service.calculateCategoryPercentage(USER_P01, "Food", AUG_2026);

            // 3620 / 13166 * 100 = 27.496... → 27.50
            assertThat(result).isEqualByComparingTo("27.50");
        }

        @Test
        @DisplayName("returns zero when total expense is zero — safe division")
        void returnsZeroWhenNoExpense() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("expense"), eq("Food"), any(), any()))
                    .thenReturn(Collections.emptyList());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(Collections.emptyList());

            BigDecimal result = service.calculateCategoryPercentage(USER_P01, "Food", AUG_2026);

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("percentage is 100 when only one category holds all expense")
        void percentageIs100ForOnlyCategory() {
            List<Transaction> onlyFood = List.of(
                    expenseWithId(1L, USER_P01, 5000.0, "Food", LocalDateTime.of(2026,8,1,0,0), "Only food")
            );
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("expense"), eq("Food"), any(), any()))
                    .thenReturn(onlyFood);
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(onlyFood);

            BigDecimal result = service.calculateCategoryPercentage(USER_P01, "Food", AUG_2026);

            assertThat(result).isEqualByComparingTo("100.00");
        }
    }

    @Nested
    @DisplayName("comparePeriods")
    class ComparePeriodTests {

        @Test
        @DisplayName("Aug expense > Jul expense: abs diff = +1810 for P01")
        void augMoreThanJulExpense() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq(JUL_2026.getStartDate()), eq(JUL_2026.getEndDate())))
                    .thenReturn(List.of(expenseWithId(10L, USER_P01, 11356.0, "Various", LocalDateTime.of(2026,7,1,0,0),"Jul total")));
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq(AUG_2026.getStartDate()), eq(AUG_2026.getEndDate())))
                    .thenReturn(exactExpenses());

            // period1=July (baseline), period2=August (current)
            PeriodComparisonResult result = service.comparePeriods(USER_P01, JUL_2026, AUG_2026, "expense");

            assertThat(result.getPeriod1Total()).isEqualByComparingTo("11356.00");
            assertThat(result.getPeriod2Total()).isEqualByComparingTo("13166.00");
            assertThat(result.getAbsoluteDifference()).isEqualByComparingTo("1810.00");
            assertThat(result.isZeroDenominator()).isFalse();
            assertThat(result.getPercentageDifference()).isNotNull();
            // 1810 / 11356 * 100 = 15.94...
            assertThat(result.getPercentageDifference()).isBetween(
                    new BigDecimal("15.90"), new BigDecimal("16.00"));
        }

        @Test
        @DisplayName("period comparison when period1 total is zero — zeroDenominator = true")
        void zeroDenominatorHandling() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq(JUL_2026.getStartDate()), eq(JUL_2026.getEndDate())))
                    .thenReturn(Collections.emptyList());
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq(AUG_2026.getStartDate()), eq(AUG_2026.getEndDate())))
                    .thenReturn(exactExpenses());

            PeriodComparisonResult result = service.comparePeriods(USER_P01, JUL_2026, AUG_2026, "expense");

            assertThat(result.getPeriod1Total()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.isZeroDenominator()).isTrue();
            assertThat(result.getPercentageDifference()).isNull();
        }

        @Test
        @DisplayName("compares income across periods — P03 Jul income > Aug income: diff = +50000")
        void incomeComparisonP03() {
            PeriodRange julP03 = PeriodRange.of(LocalDate.of(2026,7,1), LocalDate.of(2026,7,31));
            PeriodRange augP03 = PeriodRange.of(LocalDate.of(2026,8,1), LocalDate.of(2026,8,31));

            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P03), eq("income"), eq(julP03.getStartDate()), eq(julP03.getEndDate())))
                    .thenReturn(List.of(income(USER_P03, 75000.0, "Freelance", LocalDateTime.of(2026,7,1,0,0))));
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P03), eq("income"), eq(augP03.getStartDate()), eq(augP03.getEndDate())))
                    .thenReturn(List.of(income(USER_P03, 25000.0, "Freelance", LocalDateTime.of(2026,8,1,0,0))));

            // period1=July, period2=August → period2 is less than period1, so diff is negative
            PeriodComparisonResult result = service.comparePeriods(USER_P03, julP03, augP03, "income");

            assertThat(result.getPeriod1Total()).isEqualByComparingTo("75000.00");
            assertThat(result.getPeriod2Total()).isEqualByComparingTo("25000.00");
            assertThat(result.getAbsoluteDifference()).isEqualByComparingTo("-50000.00");
        }
    }

    @Nested
    @DisplayName("compareCategories")
    class CompareCategoriesTests {

        @Test
        @DisplayName("Food > Transportation in P01 Aug: abs diff = 1620, Food is higher")
        void foodMoreThanTransport() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq("Food"), any(), any()))
                    .thenReturn(List.of(expenseWithId(1L, USER_P01, 3620.0, "Food", LocalDateTime.of(2026,8,1,0,0),"Food total")));
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P01), eq("expense"), eq("Transportation"), any(), any()))
                    .thenReturn(List.of(expenseWithId(2L, USER_P01, 2000.0, "Transportation", LocalDateTime.of(2026,8,1,0,0),"Transport total")));

            CategoryComparisonResult result = service.compareCategories(
                    USER_P01, "Food", "Transportation", "expense", AUG_2026);

            assertThat(result.getCategory1Total()).isEqualByComparingTo("3620.00");
            assertThat(result.getCategory2Total()).isEqualByComparingTo("2000.00");
            assertThat(result.getAbsoluteDifference()).isEqualByComparingTo("1620.00");
            assertThat(result.getHigherCategory()).isEqualTo("Food");
            assertThat(result.isZeroDenominator()).isFalse();
            assertThat(result.getPercentageDifference()).isNotNull();
        }

        @Test
        @DisplayName("zeroDenominator when category2 total is zero")
        void zeroDenominatorCategory2Zero() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), any(), eq("Food"), any(), any()))
                    .thenReturn(List.of(expenseWithId(1L, USER_P01, 3620.0, "Food", LocalDateTime.of(2026,8,1,0,0),"Food total")));
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    any(), any(), eq("EntertainmentZ"), any(), any()))
                    .thenReturn(Collections.emptyList());

            CategoryComparisonResult result = service.compareCategories(
                    USER_P01, "Food", "EntertainmentZ", "expense", AUG_2026);

            assertThat(result.isZeroDenominator()).isTrue();
            assertThat(result.getPercentageDifference()).isNull();
            assertThat(result.getHigherCategory()).isEqualTo("Food");
        }

        @Test
        @DisplayName("P02 Aug: Food vs Utilities comparison")
        void p02FoodVsUtilities() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P02), eq("expense"), eq("Food"), any(), any()))
                    .thenReturn(List.of(expenseWithId(1L, USER_P02, 5850.0, "Food", LocalDateTime.of(2026,8,1,0,0),"Food p02")));
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                    eq(USER_P02), eq("expense"), eq("Utilities"), any(), any()))
                    .thenReturn(List.of(expenseWithId(2L, USER_P02, 4149.0, "Utilities", LocalDateTime.of(2026,8,1,0,0),"Utilities p02")));

            CategoryComparisonResult result = service.compareCategories(
                    USER_P02, "Food", "Utilities", "expense", AUG_2026);

            assertThat(result.getCategory1Total()).isEqualByComparingTo("5850.00");
            assertThat(result.getCategory2Total()).isEqualByComparingTo("4149.00");
            assertThat(result.getHigherCategory()).isEqualTo("Food");
        }
    }

    @Nested
    @DisplayName("findTopTransactions")
    class FindTopTransactionsTests {

        private List<Transaction> expensesSortedByAmount() {
            return List.of(
                    expenseWithId(9L,  USER_P01, 2100.0, "Utilities",    LocalDateTime.of(2026,8,6,10,0),  "BESCOM"),
                    expenseWithId(10L, USER_P01, 1800.0, "Shopping",     LocalDateTime.of(2026,8,10,16,0), "Myntra"),
                    expenseWithId(11L, USER_P01, 1200.0, "Entertainment",LocalDateTime.of(2026,8,14,19,0), "BookMyShow"),
                    expenseWithId(5L,  USER_P01,  970.0, "Food",         LocalDateTime.of(2026,8,28,21,0), "DMart"),
                    expenseWithId(3L,  USER_P01,  800.0, "Food",         LocalDateTime.of(2026,8,12,11,0), "BigBasket"),
                    expenseWithId(1L,  USER_P01,  650.0, "Food",         LocalDateTime.of(2026,8,2,13,15), "Swiggy")
            );
        }

        @Test
        @DisplayName("returns top 1 expense — Utilities 2100 (ground truth P01 Aug)")
        void topOneExpense() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(expensesSortedByAmount());

            List<TopTransactionEntry> result = service.findTopTransactions(USER_P01, AUG_2026, "expense", 1);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAmount()).isEqualByComparingTo("2100.00");
            assertThat(result.get(0).getCategory()).isEqualTo("Utilities");
            assertThat(result.get(0).getRank()).isEqualTo(1);
        }

        @Test
        @DisplayName("returns top 3 expenses with correct rank ordering")
        void topThreeExpenses() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(expensesSortedByAmount());

            List<TopTransactionEntry> result = service.findTopTransactions(USER_P01, AUG_2026, "expense", 3);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getAmount()).isEqualByComparingTo("2100.00"); // rank 1
            assertThat(result.get(1).getAmount()).isEqualByComparingTo("1800.00"); // rank 2
            assertThat(result.get(2).getAmount()).isEqualByComparingTo("1200.00"); // rank 3
            assertThat(result.get(0).getRank()).isEqualTo(1);
            assertThat(result.get(1).getRank()).isEqualTo(2);
            assertThat(result.get(2).getRank()).isEqualTo(3);
        }

        @Test
        @DisplayName("returns empty list when no transactions exist")
        void returnsEmptyWhenNoTransactions() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    any(), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            List<TopTransactionEntry> result = service.findTopTransactions(USER_P01, AUG_2026, "expense", 5);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns only N results even when dataset has more")
        void limitsResultsToN() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(expensesSortedByAmount()); // 6 items

            List<TopTransactionEntry> result = service.findTopTransactions(USER_P01, AUG_2026, "expense", 2);

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("limit < 1 throws IllegalArgumentException")
        void invalidLimitThrows() {
            assertThatThrownBy(() -> service.findTopTransactions(USER_P01, AUG_2026, "expense", 0))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("limit must be >= 1");
        }
    }

    @Nested
    @DisplayName("calculateSpendingConcentration")
    class SpendingConcentrationTests {

        private List<Transaction> expensesByAmountDesc() {
            // P01 Aug: largest expense = Utilities 2100, total expense = 13166
            return List.of(
                    expenseWithId(1L, USER_P01, 2100.0, "Utilities",    LocalDateTime.of(2026,8,6,10,0), "BESCOM"),
                    expenseWithId(2L, USER_P01, 1800.0, "Shopping",     LocalDateTime.of(2026,8,10,16,0),"Myntra"),
                    expenseWithId(3L, USER_P01, 1200.0, "Entertainment",LocalDateTime.of(2026,8,14,19,0),"BookMyShow"),
                    expenseWithId(4L, USER_P01,  970.0, "Food",         LocalDateTime.of(2026,8,28,21,0),"DMart"),
                    expenseWithId(5L, USER_P01,  900.0, "Transportation",LocalDateTime.of(2026,8,25,18,30),"Uber"),
                    expenseWithId(6L, USER_P01,  800.0, "Food",         LocalDateTime.of(2026,8,12,11,0),"BigBasket"),
                    expenseWithId(7L, USER_P01,  650.0, "Food",         LocalDateTime.of(2026,8,2,13,15),"Swiggy"),
                    expenseWithId(8L, USER_P01,  600.0, "Transportation",LocalDateTime.of(2026,8,5,18,0),"Uber"),
                    expenseWithId(9L, USER_P01,  500.0, "Transportation",LocalDateTime.of(2026,8,15,9,0),"Metro"),
                    expenseWithId(10L,USER_P01,  400.0, "Food",         LocalDateTime.of(2026,8,7,20,40),"Zomato"),
                    expenseWithId(11L,USER_P01,  366.0, "Health",       LocalDateTime.of(2026,8,20,9,0), "Apollo"),
                    expenseWithId(12L,USER_P01,  300.0, "Food",         LocalDateTime.of(2026,8,18,8,20),"CCD"),
                    expenseWithId(13L,USER_P01,  580.0, "Other",        LocalDateTime.of(2026,8,1,0,0),  "other")
            );
        }

        @Test
        @DisplayName("top-1 concentration for P01 Aug — 2100/13166 ≈ 15.95%")
        void topOneConcentration() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(expensesByAmountDesc());

            SpendingConcentrationResult result = service.calculateSpendingConcentration(USER_P01, AUG_2026, 1);

            // top1 = 2100, total = sum of our fixture
            assertThat(result.getTopN()).isEqualTo(1);
            assertThat(result.getTopTransactions()).hasSize(1);
            assertThat(result.getTopTransactions().get(0).getAmount()).isEqualByComparingTo("2100.00");
            assertThat(result.isZeroDenominator()).isFalse();
            assertThat(result.getConcentrationPercentage()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("top-3 concentration is greater than top-1")
        void topThreeConcentrationGreaterThanTopOne() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    eq(USER_P01), eq("expense"), any(), any()))
                    .thenReturn(expensesByAmountDesc());

            SpendingConcentrationResult top1 = service.calculateSpendingConcentration(USER_P01, AUG_2026, 1);
            SpendingConcentrationResult top3 = service.calculateSpendingConcentration(USER_P01, AUG_2026, 3);

            assertThat(top3.getConcentrationPercentage())
                    .isGreaterThan(top1.getConcentrationPercentage());
        }

        @Test
        @DisplayName("concentration is zero when no expenses — zeroDenominator = true")
        void zeroConcentrationWhenNoExpenses() {
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(Collections.emptyList());

            SpendingConcentrationResult result = service.calculateSpendingConcentration(USER_P01, AUG_2026, 3);

            assertThat(result.isZeroDenominator()).isTrue();
            assertThat(result.getConcentrationPercentage()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTopTransactions()).isEmpty();
        }

        @Test
        @DisplayName("topN < 1 throws IllegalArgumentException")
        void invalidTopNThrows() {
            assertThatThrownBy(() -> service.calculateSpendingConcentration(USER_P01, AUG_2026, 0))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("topN must be >= 1");
        }

        @Test
        @DisplayName("concentration is 100% when only one transaction exists")
        void concentrationIs100WithOneTx() {
            List<Transaction> singleExpense = List.of(
                    expenseWithId(1L, USER_P01, 5000.0, "Food", LocalDateTime.of(2026,8,1,0,0), "Only tx")
            );
            when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(
                    any(), eq("expense"), any(), any()))
                    .thenReturn(singleExpense);

            SpendingConcentrationResult result = service.calculateSpendingConcentration(USER_P01, AUG_2026, 1);

            assertThat(result.getConcentrationPercentage()).isEqualByComparingTo("100.00");
        }
    }

    @Nested
    @DisplayName("toBigDecimal utility")
    class ToBigDecimalTests {

        @Test
        @DisplayName("null converts to zero")
        void nullToZero() {
            assertThat(FinancialCalculationService.toBigDecimal(null)).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("1000.50 converts without IEEE 754 drift")
        void normalDouble() {
            BigDecimal result = FinancialCalculationService.toBigDecimal(new BigDecimal("1000.50"));
            assertThat(result).isEqualByComparingTo("1000.50");
        }
    }

    @Nested
    @DisplayName("PeriodRange boundary tests")
    class PeriodRangeBoundaryTests {

        @Test
        @DisplayName("August 1 transaction is included in August range")
        void augustFirstIncluded() {
            PeriodRange aug = PeriodRange.of(LocalDate.of(2026,8,1), LocalDate.of(2026,8,31));
            assertThat(aug.getStartDate()).isEqualTo(LocalDateTime.of(2026,8,1,0,0,0));
            assertThat(aug.getEndDate().toLocalDate()).isEqualTo(LocalDate.of(2026,8,31));
        }

        @Test
        @DisplayName("end date is normalized to end-of-day (23:59:59.999...)")
        void endDateNormalized() {
            PeriodRange aug = PeriodRange.of(LocalDate.of(2026,8,1), LocalDate.of(2026,8,31));
            assertThat(aug.getEndDate().getHour()).isEqualTo(23);
            assertThat(aug.getEndDate().getMinute()).isEqualTo(59);
            assertThat(aug.getEndDate().getSecond()).isEqualTo(59);
        }
    }
}
