package com.upiq.financial.report;

import com.upiq.auth.model.User;
import com.upiq.research.calculation.FinancialCalculationService;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;

import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.*;

class FinancialReportControllerTest {

    @Test
    void omittedMonthUsesUserSpecificLatestMonthServiceDefault() {
        User user = User.builder().id(41L).build();
        FinancialReportService service = new FinancialReportService(new FinancialCalculationService(null), null) {
            @Override
            public GeneratedFinancialReport generate(Long userId) {
                assertEquals(41L, userId);
                return new GeneratedFinancialReport("UPIQ-Monthly-Report-2026-09.pdf", "%PDF-1.4".getBytes());
            }
        };

        var response = new FinancialReportController(service).download(user, null);

        assertEquals("attachment; filename=\"UPIQ-Monthly-Report-2026-09.pdf\"",
                response.getHeaders().getFirst("Content-Disposition"));
    }

    @Test
    void downloadUsesAuthenticatedUserAndRequestedMonth() {
        User user = User.builder().id(41L).build();
        FinancialReportService service = new FinancialReportService(
                new FinancialCalculationService(null), null) {
            @Override
            public GeneratedFinancialReport generate(Long userId, YearMonth month) {
                assertEquals(41L, userId);
                assertEquals(YearMonth.of(2026, 8), month);
                return new GeneratedFinancialReport("UPIQ-Monthly-Report-2026-08.pdf", "%PDF-1.4".getBytes());
            }
        };
        FinancialReportController controller = new FinancialReportController(service);

        var response = controller.download(user, "2026-08");

        assertEquals(200, response.getStatusCode().value());
        assertEquals("application/pdf", response.getHeaders().getContentType().toString());
        assertEquals("attachment; filename=\"UPIQ-Monthly-Report-2026-08.pdf\"",
                response.getHeaders().getFirst("Content-Disposition"));
        assertArrayEquals("%PDF-1.4".getBytes(), response.getBody());
    }
}
