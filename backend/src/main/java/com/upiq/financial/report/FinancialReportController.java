package com.upiq.financial.report;

import com.upiq.auth.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

@RestController
@RequestMapping("/api/financial/report")
@RequiredArgsConstructor
public class FinancialReportController {

    private final FinancialReportService reportService;

    @GetMapping(produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal User user,
                                           @RequestParam(required = false) String month) {
        GeneratedFinancialReport report = month == null || month.isBlank()
                ? reportService.generate(user.getId())
                : reportService.generate(user.getId(), YearMonth.parse(month));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.filename() + "\"")
                .body(report.content());
    }
}
