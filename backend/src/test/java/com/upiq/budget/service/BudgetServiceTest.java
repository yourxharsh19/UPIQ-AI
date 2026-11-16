package com.upiq.budget.service;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import com.upiq.budget.dto.BudgetRequest;
import com.upiq.budget.exceptions.BudgetNotFoundException;
import com.upiq.budget.model.Budget;
import com.upiq.budget.repository.BudgetRepository;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BudgetServiceTest {
    private BudgetRepository budgets;
    private TransactionRepository transactions;
    private UserRepository users;
    private BudgetService service;
    private final Map<Long, List<Budget>> stored = new HashMap<>();
    private final AtomicLong ids = new AtomicLong(100);

    @BeforeEach
    void setUp() {
        budgets = mock(BudgetRepository.class);
        transactions = mock(TransactionRepository.class);
        users = mock(UserRepository.class);
        service = new BudgetService(budgets, transactions, users);
        when(budgets.findForUserAndPeriodAndCategory(anyLong(), any(), any())).thenReturn(Optional.empty());
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(anyLong(), any()))
                .thenAnswer(invocation -> stored.getOrDefault(invocation.getArgument(0), List.of()));
        when(budgets.saveAndFlush(any(Budget.class))).thenAnswer(invocation -> {
            Budget budget = invocation.getArgument(0);
            if (budget.getId() == null) budget.setId(ids.incrementAndGet());
            stored.computeIfAbsent(budget.getUser().getId(), ignored -> new ArrayList<>()).removeIf(item -> item.getId().equals(budget.getId()));
            stored.get(budget.getUser().getId()).add(budget);
            return budget;
        });
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(anyLong(), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    void twoUsersCanCreateIndependentBudgetsForTheSameCategoryAndMonth() {
        when(users.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(users.findById(2L)).thenReturn(Optional.of(user(2L)));
        YearMonth month = YearMonth.now();

        var userABudget = service.create(1L, request("Food", "10000.00", month));
        var userBBudget = service.create(2L, request("Food", "20000.00", month));

        assertEquals("10000.00", userABudget.amount().toPlainString());
        assertEquals("20000.00", userBBudget.amount().toPlainString());
        assertEquals(1, service.getBudgets(1L, month.toString()).size());
        assertEquals(1, service.getBudgets(2L, month.toString()).size());
        verify(budgets).findForUserAndPeriodAndCategory(1L, month.atDay(1), "Food");
        verify(budgets).findForUserAndPeriodAndCategory(2L, month.atDay(1), "Food");
    }

    @Test
    void userCannotRetrieveUpdateOrDeleteAnotherUsersBudget() {
        Budget userBBudget = budget(202L, 2L, "Food", "20000.00", YearMonth.now());
        when(budgets.findByIdAndUser_Id(202L, 1L)).thenReturn(Optional.empty());

        assertTrue(service.getBudgets(1L, YearMonth.now().toString()).isEmpty());
        assertThrows(BudgetNotFoundException.class, () -> service.update(1L, 202L,
                request("Food", "500.00", YearMonth.now())));
        assertThrows(BudgetNotFoundException.class, () -> service.delete(1L, userBBudget.getId()));

        verify(budgets, times(2)).findByIdAndUser_Id(202L, 1L);
        verify(budgets, never()).saveAndFlush(any());
        verify(budgets, never()).delete(any());
    }

    @Test
    void updatingOneOwnersBudgetLeavesTheOtherOwnersBudgetUnchanged() {
        YearMonth month = YearMonth.now();
        Budget userA = budget(101L, 1L, "Food", "10000.00", month);
        Budget userB = budget(202L, 2L, "Food", "20000.00", month);
        stored.put(1L, new ArrayList<>(List.of(userA)));
        stored.put(2L, new ArrayList<>(List.of(userB)));
        when(budgets.findByIdAndUser_Id(101L, 1L)).thenReturn(Optional.of(userA));
        when(budgets.findForUserAndPeriodAndCategory(1L, month.atDay(1), "Food")).thenReturn(Optional.of(userA));

        var updated = service.update(1L, 101L, request("Food", "12000.00", month));

        assertEquals("12000.00", updated.amount().toPlainString());
        assertEquals("20000.00", service.getBudgets(2L, month.toString()).get(0).amount().toPlainString());
        assertEquals("12000.00", service.getBudgets(1L, month.toString()).get(0).amount().toPlainString());
        verify(budgets).findByIdAndUser_Id(101L, 1L);
    }

    @Test
    void categoryAndTotalCalculationsUseOnlyOwnersExpenseRowsAndPreservePaise() {
        YearMonth month = YearMonth.now();
        Budget food = budget(101L, 1L, "Food", "100.00", month);
        Budget total = budget(102L, 1L, null, "115.00", month);
        stored.put(1L, new ArrayList<>(List.of(food, total)));
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(1L), any(), any())).thenReturn(List.of(
                tx(1L, "expense", "Food", "100.25", month.atDay(4).atStartOfDay()),
                tx(1L, "expense", "Travel", "20.00", month.atDay(4).atStartOfDay()),
                tx(1L, "income", "Salary", "9999.99", month.atDay(5).atStartOfDay()),
                tx(2L, "expense", "Food", "5000.00", month.atDay(5).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(1L, month.atDay(1)))
                .thenReturn(List.of(food, total));

        List<?> responses = service.getBudgets(1L, month.toString());
        var foodResponse = service.getBudgets(1L, month.toString()).stream()
                .filter(item -> "Food".equals(item.category())).findFirst().orElseThrow();
        var totalResponse = service.getBudgets(1L, month.toString()).stream()
                .filter(item -> item.category() == null).findFirst().orElseThrow();

        assertEquals("100.25", foodResponse.spent().toPlainString());
        assertEquals("-0.25", foodResponse.remaining().toPlainString());
        assertTrue(foodResponse.overBudget());
        assertEquals("120.25", totalResponse.spent().toPlainString());
        assertEquals(2, responses.size());
        verify(transactions, atLeastOnce()).findByUserIdAndDateBetweenOrderByDateDesc(eq(1L), any(), any());
    }

    private static User user(Long id) {
        return User.builder().id(id).email("user" + id + "@example.test").username("user" + id)
                .password("not-used").role(Role.USER).active(true).build();
    }

    private static Budget budget(Long id, Long userId, String category, String amount, YearMonth month) {
        Budget budget = new Budget();
        budget.setId(id);
        budget.setUser(user(userId));
        budget.setCategory(category);
        budget.setPeriodStart(month.atDay(1));
        budget.setAmount(new BigDecimal(amount));
        return budget;
    }

    private static BudgetRequest request(String category, String amount, YearMonth month) {
        BudgetRequest request = new BudgetRequest();
        request.setCategory(category);
        request.setAmount(new BigDecimal(amount));
        request.setMonth(month.toString());
        return request;
    }

    private static Transaction tx(Long userId, String type, String category, String amount, LocalDateTime date) {
        return Transaction.builder().userId(userId).type(type).category(category)
                .amount(new BigDecimal(amount)).date(date).build();
    }
}
