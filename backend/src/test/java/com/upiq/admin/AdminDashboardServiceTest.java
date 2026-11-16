package com.upiq.admin;

import com.upiq.auth.repository.UserRepository;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminDashboardServiceTest {
    @Test
    void mapsAggregateCountsAndTotalsWithoutTransactionRows() {
        UserRepository users = mock(UserRepository.class);
        TransactionRepository transactions = mock(TransactionRepository.class);
        when(users.count()).thenReturn(7L);
        when(users.countByActiveTrue()).thenReturn(5L);
        when(transactions.getPlatformTotals()).thenReturn(java.util.List.<Object[]>of(new Object[]{11L, 12500.5, 4200.25}));

        AdminDashboardResponse response = new AdminDashboardService(users, transactions).getSummary();

        assertEquals(7L, response.getUserCount());
        assertEquals(5L, response.getActiveUserCount());
        assertEquals(11L, response.getTransactionCount());
        assertEquals(new BigDecimal("12500.5"), response.getRecordedIncome());
        assertEquals(new BigDecimal("4200.25"), response.getRecordedExpenses());
    }

    @Test
    void emptyAggregateSumsAreReportedAsZero() {
        UserRepository users = mock(UserRepository.class);
        TransactionRepository transactions = mock(TransactionRepository.class);
        when(transactions.getPlatformTotals()).thenReturn(java.util.List.<Object[]>of(new Object[]{0L, null, null}));

        AdminDashboardResponse response = new AdminDashboardService(users, transactions).getSummary();

        assertEquals(0L, response.getTransactionCount());
        assertEquals(BigDecimal.ZERO, response.getRecordedIncome());
        assertEquals(BigDecimal.ZERO, response.getRecordedExpenses());
    }

    @Test
    void emptyAggregateResultListReturnsZeroMetrics() {
        UserRepository users = mock(UserRepository.class);
        TransactionRepository transactions = mock(TransactionRepository.class);
        when(transactions.getPlatformTotals()).thenReturn(java.util.List.of());

        AdminDashboardResponse response = new AdminDashboardService(users, transactions).getSummary();

        assertEquals(0L, response.getTransactionCount());
        assertEquals(BigDecimal.ZERO, response.getRecordedIncome());
        assertEquals(BigDecimal.ZERO, response.getRecordedExpenses());
    }
}
