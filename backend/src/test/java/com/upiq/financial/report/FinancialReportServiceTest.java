package com.upiq.financial.report;

import com.upiq.research.calculation.FinancialCalculationService;
import com.upiq.research.calculation.dto.NetBalanceResult;
import com.upiq.research.calculation.dto.PeriodRange;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FinancialReportServiceTest {

    @Test
    void defaultReportMonthComesFromAuthenticatedUsersLatestTransaction() {
        TransactionRepository repository = mock(TransactionRepository.class);
        when(repository.findTopByUserIdOrderByDateDesc(11L)).thenReturn(java.util.Optional.of(
                transaction(11L, 10, "expense", "Food", "Cafe", 28)));
        AtomicReference<YearMonth> selected = new AtomicReference<>();
        FinancialReportService service = new FinancialReportService(null, repository) {
            @Override
            public GeneratedFinancialReport generate(Long userId, YearMonth month) {
                assertEquals(11L, userId);
                selected.set(month);
                return new GeneratedFinancialReport("test.pdf", new byte[0]);
            }
        };

        service.generate(11L);

        assertEquals(YearMonth.of(2026, 8), selected.get());
        verify(repository).findTopByUserIdOrderByDateDesc(11L);
    }

    @Test
    void reportUsesSelectedMonthAndAuthenticatedUserLedger() throws Exception {
        long userId = 11L;
        YearMonth month = YearMonth.of(2026, 8);
        Transaction expense = transaction(userId, 75.0, "expense", "Food", "Cafe, lunch", 12);
        Transaction income = transaction(userId, 500.0, "income", "Salary", "Pay", 1);
        Transaction transfer = transaction(userId, 900.0, "transfer", "Transfer", "Internal move", 2);
        AtomicReference<LocalDateTime> queriedCurrentStart = new AtomicReference<>();
        TransactionRepository repository = repository((ownerId, start, end) -> {
            assertEquals(userId, ownerId);
            if (start.getMonthValue() == month.getMonthValue()) {
                queriedCurrentStart.set(start);
                return List.of(expense, income, transfer);
            }
            return List.of();
        });
        FinancialCalculationService calculations = new FinancialCalculationService(repository) {
            @Override
            public NetBalanceResult calculateNetBalance(Long ownerId, PeriodRange period) {
                assertEquals(userId, ownerId);
                assertEquals(month.getMonthValue(), period.getStartDate().getMonthValue());
                return NetBalanceResult.builder().totalIncome(new BigDecimal("500.00"))
                        .totalExpense(new BigDecimal("75.00")).netBalance(new BigDecimal("425.00"))
                        .incomeTransactionCount(1).expenseTransactionCount(1).build();
            }
        };
        FinancialReportService reportService = new FinancialReportService(calculations, repository);

        GeneratedFinancialReport generated = reportService.generate(userId, month);

        assertEquals("UPIQ-Monthly-Report-2026-08.pdf", generated.filename());
        assertEquals(LocalDateTime.of(2026, 8, 1, 0, 0), queriedCurrentStart.get());
        try (var document = Loader.loadPDF(generated.content())) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(text.contains("August 2026"));
            assertTrue(text.contains("Total income: 500.00"));
            assertTrue(text.contains("Total expenses: 75.00"));
            assertTrue(text.contains("Net cash flow: 425.00"));
            assertTrue(text.contains("Food: 75.00 (100.00%)"));
            assertTrue(text.contains("Cafe, lunch"));
            assertFalse(text.contains("Internal move"));
        }
    }

    @Test
    void emptyPeriodGeneratesUsefulPdf() throws Exception {
        TransactionRepository repository = repository((ownerId, start, end) -> List.of());
        FinancialCalculationService calculations = new FinancialCalculationService(repository) {
            @Override
            public NetBalanceResult calculateNetBalance(Long ownerId, PeriodRange period) {
                return NetBalanceResult.builder().totalIncome(BigDecimal.ZERO).totalExpense(BigDecimal.ZERO)
                        .netBalance(BigDecimal.ZERO).incomeTransactionCount(0).expenseTransactionCount(0).build();
            }
        };

        GeneratedFinancialReport generated = new FinancialReportService(calculations, repository)
                .generate(7L, YearMonth.of(2026, 2));

        assertEquals("UPIQ-Monthly-Report-2026-02.pdf", generated.filename());
        try (var document = Loader.loadPDF(generated.content())) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(text.contains("February 2026"));
            assertTrue(text.contains("No expense transactions"));
            assertTrue(text.contains("No income or expense transactions"));
        }
    }

    private static Transaction transaction(long userId, double amount, String type, String category,
                                           String description, int day) {
        return Transaction.builder().userId(userId).amount(amount).type(type).category(category)
                .description(description).date(LocalDateTime.of(2026, 8, day, 10, 0)).build();
    }

    private static TransactionRepository repository(TransactionLookup lookup) {
        return (TransactionRepository) Proxy.newProxyInstance(TransactionRepository.class.getClassLoader(),
                new Class<?>[]{TransactionRepository.class}, (proxy, method, args) -> {
                    if (method.getName().equals("findByUserIdAndDateBetweenOrderByDateDesc")) {
                        return lookup.find((Long) args[0], (LocalDateTime) args[1], (LocalDateTime) args[2]);
                    }
                    if (method.getName().equals("toString")) return "test-transaction-repository";
                    if (method.getName().equals("hashCode")) return System.identityHashCode(proxy);
                    if (method.getName().equals("equals")) return proxy == args[0];
                    throw new UnsupportedOperationException(method.getName());
                });
    }

    @FunctionalInterface
    private interface TransactionLookup {
        List<Transaction> find(Long userId, LocalDateTime start, LocalDateTime end);
    }
}
