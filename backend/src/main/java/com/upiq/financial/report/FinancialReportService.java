package com.upiq.financial.report;

import com.upiq.research.calculation.FinancialCalculationService;
import com.upiq.research.calculation.dto.NetBalanceResult;
import com.upiq.research.calculation.dto.PeriodRange;
import com.upiq.research.calculation.dto.PeriodComparisonResult;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialReportService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private final FinancialCalculationService calculationService;
    private final TransactionRepository transactionRepository;

    public GeneratedFinancialReport generate(Long userId) {
        YearMonth latestAvailableMonth = transactionRepository.findTopByUserIdOrderByDateDesc(userId)
                .map(Transaction::getDate).map(YearMonth::from).orElseGet(YearMonth::now);
        return generate(userId, latestAvailableMonth);
    }

    public GeneratedFinancialReport generate(Long userId, YearMonth month) {
        PeriodRange period = PeriodRange.of(month.atDay(1), month.atEndOfMonth());
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                userId, period.getStartDate(), period.getEndDate()).stream()
                .filter(transaction -> isIncomeOrExpense(transaction.getType()))
                .toList();
        NetBalanceResult summary = calculationService.calculateNetBalance(userId, period);
        PeriodRange priorPeriod = PeriodRange.of(month.minusMonths(1).atDay(1), month.minusMonths(1).atEndOfMonth());
        boolean hasPriorMonthData = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                userId, priorPeriod.getStartDate(), priorPeriod.getEndDate()).stream()
                .anyMatch(transaction -> isIncomeOrExpense(transaction.getType()));
        PeriodComparisonResult incomeComparison = hasPriorMonthData
                ? calculationService.comparePeriods(userId, priorPeriod, period, "income") : null;
        PeriodComparisonResult expenseComparison = hasPriorMonthData
                ? calculationService.comparePeriods(userId, priorPeriod, period, "expense") : null;
        Map<String, BigDecimal> categories = new LinkedHashMap<>();
        for (Transaction transaction : transactions) {
            if (!"expense".equalsIgnoreCase(transaction.getType())) continue;
            String category = transaction.getCategory() == null || transaction.getCategory().isBlank()
                    ? "Uncategorized" : transaction.getCategory();
            BigDecimal amount = transaction.getAmount() == null ? BigDecimal.ZERO : BigDecimal.valueOf(transaction.getAmount());
            categories.merge(category, amount, BigDecimal::add);
        }
        categories.replaceAll((category, amount) -> amount.setScale(2, RoundingMode.HALF_UP));
        Map<String, BigDecimal> sortedCategories = categories.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (first, second) -> first, LinkedHashMap::new));
        BigDecimal averageExpense = summary.getExpenseTransactionCount() == 0 ? BigDecimal.ZERO
                : summary.getTotalExpense().divide(BigDecimal.valueOf(summary.getExpenseTransactionCount()), 2, RoundingMode.HALF_UP);
        String monthLabel = month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy"));
        return new GeneratedFinancialReport("UPIQ-Monthly-Report-" + month + ".pdf",
                createPdf(monthLabel, summary, averageExpense, sortedCategories, transactions, incomeComparison, expenseComparison));
    }

    private byte[] createPdf(String monthLabel, NetBalanceResult summary, BigDecimal averageExpense,
                             Map<String, BigDecimal> categories, List<Transaction> transactions,
                             PeriodComparisonResult incomeComparison, PeriodComparisonResult expenseComparison) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Page page = new Page(document);
            page.title("UPIQ AI - Monthly Financial Report");
            page.paragraph("Reporting period: " + monthLabel + " | Amounts shown in INR");
            page.section("Financial summary");
            page.row("Total income", amount(summary.getTotalIncome()));
            page.row("Total expenses", amount(summary.getTotalExpense()));
            page.row("Net cash flow", amount(summary.getNetBalance()));
            page.row("Transaction count", String.valueOf(summary.getIncomeTransactionCount() + summary.getExpenseTransactionCount()));
            page.row("Average expense", amount(averageExpense));

            page.section("Month-over-month comparison");
            page.row("Income change", incomeComparison == null ? "Unavailable (no prior-month transactions)" : comparisonText(incomeComparison));
            page.row("Expense change", expenseComparison == null ? "Unavailable (no prior-month transactions)" : comparisonText(expenseComparison));

            page.section("Expense by category");
            if (categories.isEmpty()) page.paragraph("No expense transactions are recorded for this month.");
            else for (Map.Entry<String, BigDecimal> category : categories.entrySet()) {
                BigDecimal percentage = summary.getTotalExpense().compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : category.getValue().divide(summary.getTotalExpense(), 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
                page.row(category.getKey(), amount(category.getValue()) + " (" + amount(percentage) + "%)");
            }

            page.section("Transactions");
            if (transactions.isEmpty()) page.paragraph("No income or expense transactions are recorded for this month.");
            else {
                for (Transaction transaction : transactions) {
                    page.transaction(transaction);
                }
            }
            page.finish();
            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Could not generate financial report", exception);
        }
    }

    private static boolean isIncomeOrExpense(String type) {
        return "income".equalsIgnoreCase(type) || "expense".equalsIgnoreCase(type);
    }

    private static String amount(BigDecimal value) {
        return value == null ? "0.00" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String comparisonText(PeriodComparisonResult comparison) {
        if (comparison == null || comparison.getPeriod1Total() == null || comparison.getPeriod2Total() == null) {
            return "Unavailable";
        }
        String change = amount(comparison.getAbsoluteDifference());
        return comparison.getPercentageDifference() == null
                ? change + " (percentage unavailable; prior month was zero)"
                : change + " (" + amount(comparison.getPercentageDifference()) + "%)";
    }

    private static String safe(String value) {
        return value == null ? "" : value.replaceAll("[^\\x20-\\x7E]", "?");
    }

    private static final class Page {
        private static final float LEFT = 48;
        private final PDDocument document;
        private final PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        private final PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private PDPageContentStream stream;
        private float y;

        private Page(PDDocument document) throws IOException { this.document = document; newPage(); }

        private void newPage() throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - 52;
        }

        private void ensure(float height) throws IOException { if (y - height < 48) newPage(); }

        private void text(String value, PDType1Font font, float size) throws IOException {
            stream.beginText();
            stream.setFont(font, size);
            stream.newLineAtOffset(LEFT, y);
            stream.showText(safe(value));
            stream.endText();
            y -= size + 6;
        }

        private void title(String value) throws IOException { ensure(30); text(value, bold, 18); y -= 8; }
        private void section(String value) throws IOException { ensure(24); y -= 6; text(value, bold, 12); }
        private void paragraph(String value) throws IOException { ensure(18); text(value, regular, 9); }
        private void row(String label, String value) throws IOException { ensure(18); text(label + ": " + value, regular, 9); }

        private void transaction(Transaction transaction) throws IOException {
            String date = transaction.getDate() == null ? "Date unavailable" : DATE.format(transaction.getDate());
            String description = transaction.getDescription() == null || transaction.getDescription().isBlank()
                    ? "Transaction" : transaction.getDescription();
            String category = transaction.getCategory() == null || transaction.getCategory().isBlank()
                    ? "Uncategorized" : transaction.getCategory();
            String detail = date + " | " + transaction.getType() + " | " + description + " | " + category
                    + " | " + amount(transaction.getAmount() == null ? BigDecimal.ZERO : BigDecimal.valueOf(transaction.getAmount()));
            ensure(18);
            text(detail.length() > 145 ? detail.substring(0, 142) + "..." : detail, regular, 8);
        }

        private void finish() throws IOException { if (stream != null) { stream.close(); stream = null; } }
    }
}
