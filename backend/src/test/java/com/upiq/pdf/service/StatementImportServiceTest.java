package com.upiq.pdf.service;

import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.StatementImportResult;
import com.upiq.pdf.dto.StatementRow;
import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.transaction.dto.CreateTransactionRequest;
import com.upiq.transaction.dto.TransactionResponse;
import com.upiq.transaction.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StatementImportServiceTest {

    @Test
    void preservesDistinctSourceRowsAndStableIdentityAcrossRetriesAndUsers() {
        FakeTransactionService transactions = new FakeTransactionService(true, true, false, false, true, true);
        StatementImportService service = new StatementImportService(new FixedParserService(parsed(row(3), row(8))), transactions);
        MockMultipartFile file = file("same statement bytes");

        StatementImportResult firstUserFirstRun = service.importStatement(file, 11L);
        StatementImportResult firstUserRetry = service.importStatement(file, 11L);
        StatementImportResult secondUserRun = service.importStatement(file, 12L);

        assertEquals(2, firstUserFirstRun.getImportedCount());
        assertEquals(2, firstUserRetry.getDuplicateCount());
        assertEquals(2, secondUserRun.getImportedCount());
        List<String> identities = transactions.calls.stream().map(Call::identity).toList();
        assertEquals(identities.get(0), identities.get(2));
        assertEquals(identities.get(1), identities.get(3));
        assertNotEquals(identities.get(0), identities.get(1));
        assertEquals(List.of(11L, 11L, 11L, 11L, 12L, 12L), transactions.calls.stream().map(Call::userId).toList());
        assertTrue(identities.get(0).matches("[0-9a-f]{64}:3"));
    }

    @Test
    void reportsInvalidRowsAndContinuesAfterPerRowFailure() {
        TransactionRequest invalid = row(1);
        invalid.setDate(null);
        FakeTransactionService transactions = new FakeTransactionService();
        transactions.failNext = true;
        StatementImportService service = new StatementImportService(
                new FixedParserService(parsedWithCounts(List.of(row(0), invalid), 1)), transactions);

        StatementImportResult result = service.importStatement(file("partial import"), 5L);

        assertEquals(0, result.getImportedCount());
        assertEquals(0, result.getDuplicateCount());
        assertEquals(2, result.getRejectedCount());
        assertEquals(1, result.getFailedCount());
        assertEquals(1, transactions.attempts);
    }

    @Test
    void previewAndImportUseSameCsvValidationAndAccountForEveryRow() {
        String csv = "date,amount,type,description\n"
                + "05/09/2026,25,debit,Coffee\n"
                + "   ,30,credit,Blank date\n"
                + "not-a-date,30,credit,Bad date\n"
                + "05/09/2026,0,credit,Zero amount\n";
        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes());
        FileValidationService fileValidation = new FileValidationService();
        org.springframework.test.util.ReflectionTestUtils.setField(fileValidation, "maxFileSize", 10 * 1024 * 1024L);
        ParserService parser = new ParserService(fileValidation, null,
                new CSVParserService(new TransactionMappingService()));
        ParsingResponse preview = parser.parseFile(file);
        FakeTransactionService transactions = new FakeTransactionService(true);

        StatementImportResult result = new StatementImportService(parser, transactions).importStatement(file, 5L);

        assertEquals(4, preview.getTotalTransactions());
        assertEquals(1, preview.getSuccessfulParses());
        assertEquals(3, preview.getFailedParses());
        assertEquals(1, preview.getTransactions().size());
        assertEquals(4, preview.getRows().size());
        assertEquals(1, result.getImportedCount());
        assertEquals(3, result.getRejectedCount());
        assertEquals(0, result.getFailedCount());
        assertEquals(List.of(1, 2, 3), result.getRejectedRows().stream().map(StatementRow::getSourceRowIndex).toList());
        for (StatementRow rejected : result.getRejectedRows()) {
            assertEquals(preview.getRows().get(rejected.getSourceRowIndex()).getValidationReasons(), rejected.getValidationReasons());
        }
        assertEquals(List.of("missing_date"), result.getRejectedRows().get(0).getValidationReasons().stream().map(r -> r.getCode()).toList());
        assertEquals(List.of("invalid_date"), result.getRejectedRows().get(1).getValidationReasons().stream().map(r -> r.getCode()).toList());
        assertEquals(1, transactions.attempts);
    }

    @Test
    void fallsBackToTransactionsWhenRowsMetadataIsNull() {
        assertLegacyRowsFallback(null);
    }

    @Test
    void fallsBackToTransactionsWhenRowsMetadataIsEmpty() {
        assertLegacyRowsFallback(List.of());
    }

    @Test
    void preservesReasonsWhenNonEmptyRowsMetadataIsProvided() {
        TransactionRequest invalidDate = row(4);
        invalidDate.setDate(null);
        StatementRow parsedRow = StatementRow.builder().sourceRowIndex(4).transaction(invalidDate)
                .validationReasons(List.of(com.upiq.pdf.dto.StatementRowValidationReason.INVALID_DATE)).build();
        ParsingResponse parsed = ParsingResponse.builder().transactions(List.of(row(4))).rows(List.of(parsedRow)).build();
        FakeTransactionService transactions = new FakeTransactionService();

        StatementImportResult result = new StatementImportService(new FixedParserService(parsed), transactions)
                .importStatement(file("row metadata"), 5L);

        assertEquals(1, result.getRejectedCount());
        assertEquals(0, result.getImportedCount());
        assertEquals(0, transactions.attempts);
        assertEquals(List.of(com.upiq.pdf.dto.StatementRowValidationReason.INVALID_DATE),
                result.getRejectedRows().get(0).getValidationReasons());
    }

    private static void assertLegacyRowsFallback(List<StatementRow> rows) {
        TransactionRequest valid = row(2);
        ParsingResponse parsed = ParsingResponse.builder().transactions(List.of(valid)).rows(rows).build();
        FakeTransactionService transactions = new FakeTransactionService(true);

        StatementImportResult result = new StatementImportService(new FixedParserService(parsed), transactions)
                .importStatement(file("legacy rows"), 5L);

        assertEquals(1, result.getImportedCount());
        assertEquals(0, result.getRejectedCount());
        assertEquals(1, transactions.attempts);
    }

    private static MockMultipartFile file(String contents) {
        return new MockMultipartFile("file", "statement.csv", "text/csv", contents.getBytes());
    }

    private static ParsingResponse parsed(TransactionRequest... rows) {
        return parsedWithCounts(List.of(rows), 0);
    }

    private static ParsingResponse parsedWithCounts(List<TransactionRequest> rows, int parserFailures) {
        return ParsingResponse.builder().transactions(rows).failedParses(parserFailures).build();
    }

    private static TransactionRequest row(int sourceRowIndex) {
        return TransactionRequest.builder()
                .amount(20.0).type("expense").description("Same merchant")
                .date(LocalDateTime.of(2026, 9, 1, 10, 0)).sourceRowIndex(sourceRowIndex).build();
    }

    private record Call(CreateTransactionRequest request, Long userId, String identity) { }

    private static final class FixedParserService extends ParserService {
        private final ParsingResponse response;
        private FixedParserService(ParsingResponse response) {
            super(null, null, null);
            this.response = response;
        }
        @Override public ParsingResponse parseFile(org.springframework.web.multipart.MultipartFile file) { return response; }
    }

    private static final class FakeTransactionService implements TransactionService {
        private final List<Call> calls = new ArrayList<>();
        private final boolean[] outcomes;
        private int nextOutcome;
        private int attempts;
        private boolean failNext;

        private FakeTransactionService(boolean... outcomes) { this.outcomes = outcomes; }

        @Override
        public boolean addImportedTransaction(CreateTransactionRequest request, Long userId, String identity) {
            attempts++;
            if (failNext) {
                failNext = false;
                throw new IllegalStateException("simulated row failure");
            }
            calls.add(new Call(request, userId, identity));
            return outcomes.length == 0 || outcomes[nextOutcome++];
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
