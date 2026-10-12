package com.upiq.pdf.service;

import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.StatementImportResult;
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
