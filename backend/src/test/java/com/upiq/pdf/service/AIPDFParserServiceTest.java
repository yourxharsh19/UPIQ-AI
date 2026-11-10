package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.exceptions.ParsingException;
import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.StatementImportResult;
import com.upiq.pdf.dto.StatementRowValidationReason;
import com.upiq.transaction.service.TransactionService;
import com.upiq.transaction.dto.CreateTransactionRequest;
import com.upiq.transaction.dto.TransactionResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AIPDFParserServiceTest {
    private final AIPDFParserService parser = new AIPDFParserService();

    @BeforeAll
    static void useWorkspaceFontCache() throws Exception {
        Path cache = Path.of("target", "pdfbox-font-cache").toAbsolutePath();
        Files.createDirectories(cache);
        System.setProperty("pdfbox.fontcache", cache.toString());
    }

    @Test
    void extractsTransactionFromTextPdfFixture() throws Exception {
        MockMultipartFile file = pdf("01/10/2025", "Paid to Acme Stores Rs. 250.00");
        List<TransactionRequest> transactions = parser.parsePDF(file);
        assertEquals(1, transactions.size());
        assertEquals(250.0, transactions.get(0).getAmount());
        assertEquals("expense", transactions.get(0).getType());
        assertEquals(1, transactions.get(0).getSourceRowIndex());
    }

    @Test
    void emptyPdfTextIsRejected() throws Exception {
        assertThrows(ParsingException.class, () -> parser.parsePDF(pdf("", "")));
    }

    @Test
    void unsupportedLayoutReturnsNoTransaction() throws Exception {
        assertEquals(List.of(), parser.parsePDF(pdf("Statement of account", "No recognizable transaction row")));
    }

    @Test
    void missingPdfDateRemainsMissingRatherThanBeingSynthesized() throws Exception {
        List<TransactionRequest> transactions = parser.parsePDF(pdf("", "Paid to Acme Stores Rs. 250.00"));
        assertEquals(1, transactions.size());
        assertNull(transactions.get(0).getDate());
    }

    @Test
    void parserPreviewMarksMissingPdfDateInvalidWithoutApplyingCsvFallbacks() throws Exception {
        FileValidationService validation = new FileValidationService();
        org.springframework.test.util.ReflectionTestUtils.setField(validation, "maxFileSize", 10 * 1024 * 1024L);
        ParserService parserService = new ParserService(validation, parser, null);
        ParsingResponse response = parserService.parseFile(pdf("", "Paid to Acme Stores Rs. 250.00"));

        assertEquals(1, response.getTotalTransactions());
        assertEquals(0, response.getSuccessfulParses());
        assertEquals(1, response.getFailedParses());
        assertEquals(List.of(com.upiq.pdf.dto.StatementRowValidationReason.MISSING_DATE),
                response.getRows().get(0).getValidationReasons());
    }

    @Test
    void unparseableAmountIsNotReturnedAsTransaction() throws Exception {
        assertEquals(List.of(), parser.parsePDF(pdf("01/10/2025", "Paid to Acme Stores Rs. abc")));
    }

    @Test
    void amountsAroundOneMillionAreParsedAsValidRows() throws Exception {
        for (double expected : List.of(999_999.99, 1_000_000.00, 1_000_000.01)) {
            String amount = String.format(java.util.Locale.ROOT, "%.2f", expected);
            List<com.upiq.pdf.dto.StatementRow> rows = parser.parsePDFRows(
                    pdf("01/10/2025", "Paid to Acme Stores Rs. " + amount));

            assertEquals(1, rows.size());
            assertEquals(expected, rows.get(0).getTransaction().getAmount());
            assertTrue(rows.get(0).getValidationReasons().isEmpty());
            assertEquals(1, rows.get(0).getSourceRowIndex());
        }
    }

    @Test
    void malformedPdfAmountRemainsAnInvalidAmountRejection() throws Exception {
        List<com.upiq.pdf.dto.StatementRow> rows = parser.parsePDFRows(
                pdf("01/10/2025", "Paid to Acme Stores Rs. abc"));

        assertEquals(1, rows.size());
        assertNull(rows.get(0).getTransaction().getAmount());
        assertEquals(List.of(StatementRowValidationReason.INVALID_AMOUNT), rows.get(0).getValidationReasons());
        assertEquals(1, rows.get(0).getSourceRowIndex());
    }

    @Test
    void malformedPdfAmountIsIncludedInPreviewAndImportRejectedRowAccounting() throws Exception {
        MockMultipartFile file = pdf("01/10/2025", "Paid to Acme Stores Rs. abc");
        FileValidationService validation = new FileValidationService();
        org.springframework.test.util.ReflectionTestUtils.setField(validation, "maxFileSize", 10 * 1024 * 1024L);
        ParserService parserService = new ParserService(validation, parser, null);

        ParsingResponse preview = parserService.parseFile(file);
        assertEquals(1, preview.getTotalTransactions());
        assertEquals(0, preview.getSuccessfulParses());
        assertEquals(1, preview.getFailedParses());
        assertEquals(1, preview.getRows().size());
        assertEquals(StatementRowValidationReason.INVALID_AMOUNT,
                preview.getRows().get(0).getValidationReasons().get(0));
        assertEquals(1, preview.getRows().get(0).getSourceRowIndex());

        CountingTransactionService transactionService = new CountingTransactionService();
        StatementImportResult result = new StatementImportService(parserService, transactionService)
                .importStatement(file, 7L);
        assertEquals(1, result.getRejectedCount());
        assertEquals(0, result.getImportedCount());
        assertEquals(0, result.getFailedCount());
        assertEquals(StatementRowValidationReason.INVALID_AMOUNT,
                result.getRejectedRows().get(0).getValidationReasons().get(0));
        assertEquals(1, result.getRejectedRows().get(0).getSourceRowIndex());
        assertEquals(0, transactionService.importAttempts);
    }

    private MockMultipartFile pdf(String... lines) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(50, 700);
                for (String line : lines) {
                    content.showText(line);
                    content.newLineAtOffset(0, -18);
                }
                content.endText();
            }
            document.save(output);
            return new MockMultipartFile("file", "fixture.pdf", "application/pdf", output.toByteArray());
        }
    }

    private static final class CountingTransactionService implements TransactionService {
        private int importAttempts;
        @Override public boolean addImportedTransaction(CreateTransactionRequest request, Long userId, String identity) {
            importAttempts++;
            return true;
        }
        @Override public TransactionResponse addTransaction(CreateTransactionRequest request, Long userId) { throw new UnsupportedOperationException(); }
        @Override public List<TransactionResponse> getUserTransactions(Long userId) { throw new UnsupportedOperationException(); }
        @Override public List<TransactionResponse> getUserTransactionsByCategory(Long userId, String category) { throw new UnsupportedOperationException(); }
        @Override public void deleteTransaction(Long id, Long userId) { throw new UnsupportedOperationException(); }
        @Override public TransactionResponse getById(Long id, Long userId) { throw new UnsupportedOperationException(); }
        @Override public TransactionResponse updateTransaction(Long id, CreateTransactionRequest request, Long userId) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllTransactions(Long userId) { throw new UnsupportedOperationException(); }
    }
}
