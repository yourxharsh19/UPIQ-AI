package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.dto.StatementRow;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CSVParserServiceTest {

    @Test
    void doesNotWriteUploadedTransactionContentOrFilenameToLogs() {
        String filename = "private-filename-marker.csv";
        String amount = "private-amount-marker";
        String description = "private-description-marker";
        String csv = "amount,type,description\n" + amount + ",expense," + description + "\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", filename, "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        Logger logger = (Logger) LoggerFactory.getLogger(CSVParserService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            new CSVParserService(new TransactionMappingService()).parseCSV(file);

            String loggedMessages = appender.list.stream()
                    .map(ILoggingEvent::getFormattedMessage)
                    .reduce("", (left, right) -> left + " " + right);
            assertFalse(loggedMessages.contains(filename));
            assertFalse(loggedMessages.contains(amount));
            assertFalse(loggedMessages.contains(description));
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void doesNotInventTransactionDateWhenCsvHasNoDateColumn() {
        String csv = "amount,type,description\n125.50,expense,Coffee shop\n5000,income,Salary\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "statement.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        CSVParserService parser = new CSVParserService(new TransactionMappingService());

        List<TransactionRequest> transactions = parser.parseCSV(file);

        assertEquals(2, transactions.size());
        assertEquals(125.50, transactions.get(0).getAmount());
        assertEquals("expense", transactions.get(0).getType());
        assertEquals(0, transactions.get(0).getSourceRowIndex());
        assertNull(transactions.get(0).getDate());
        assertEquals("income", transactions.get(1).getType());
        assertEquals(1, transactions.get(1).getSourceRowIndex());
        assertNull(transactions.get(1).getDate());
    }

    @Test
    void legacyParseCsvKeepsOnlyPositiveAmountTransactions() {
        String csv = "date,amount,type,description\n"
                + "malformed,25,debit,Positive amount\n"
                + "05/09/2026,0,debit,Zero amount\n"
                + "05/09/2026,not-money,debit,Invalid amount\n";
        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        List<TransactionRequest> transactions = new CSVParserService(new TransactionMappingService()).parseCSV(file);

        assertEquals(1, transactions.size());
        assertEquals(25.0, transactions.get(0).getAmount());
        assertNull(transactions.get(0).getDate());
    }

    @Test
    void unexpectedRecordFailureUsesGenericReasonAndKeepsSourceIdentity() {
        TransactionMappingService failingMapping = new TransactionMappingService() {
            @Override
            public String extractType(String text) {
                throw new IllegalStateException("synthetic parser failure");
            }
        };
        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv",
                "date,amount,type,description\n05/09/2026,25,credit,Coffee\n".getBytes(StandardCharsets.UTF_8));

        StatementRow row = new CSVParserService(failingMapping).parseCSVRows(file).get(0);

        assertEquals(0, row.getSourceRowIndex());
        assertEquals(0, row.getTransaction().getSourceRowIndex());
        assertEquals(List.of("parsing_failure"), row.getValidationReasons().stream().map(r -> r.getCode()).toList());
    }

    @Test
    void nonFiniteAmountsUseInvalidAmountReasonInParserAndSharedValidator() {
        String csv = "date,amount,type,description\n05/09/2026,Infinity,debit,Coffee\n"
                + "05/09/2026," + "9".repeat(400) + ",debit,Overflow amount\n";
        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        List<StatementRow> parsed = new CSVParserService(new TransactionMappingService()).parseCSVRows(file);
        TransactionRequest nonFinite = TransactionRequest.builder().amount(Double.POSITIVE_INFINITY).build();

        assertEquals(2, parsed.size());
        assertTrue(parsed.stream().allMatch(row -> row.getValidationReasons().stream().map(r -> r.getCode()).toList().equals(List.of("invalid_amount"))));
        assertTrue(StatementRowValidator.validate(nonFinite).contains(com.upiq.pdf.dto.StatementRowValidationReason.INVALID_AMOUNT));
    }

    @Test
    void accountsForEveryRowAndReportsActionableValidationReasons() {
        String csv = "date,amount,type,description\n"
                + "05/09/2026,25,debit,Coffee\n"
                + " ,30,credit,Blank date\n"
                + "not-a-date,31,credit,Bad date\n"
                + "05/09/2026,0,credit,Zero amount\n"
                + "05/09/2026,,credit,Missing amount\n"
                + "05/09/2026,not-an-amount,credit,Invalid amount\n"
                + "05/09/2026,Infinity,credit,Non-finite amount\n"
                + "05/09/2026,20,credit, \n"
                + "05/09/2026,10,unknown,Unknown type\n"
                + "bad,0,unknown, \n";
        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        List<StatementRow> rows = new CSVParserService(new TransactionMappingService()).parseCSVRows(file);

        assertEquals(10, rows.size());
        assertEquals(0, rows.get(0).getSourceRowIndex());
        assertTrue(rows.get(0).isValid());
        assertTrue(rows.get(1).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("missing_date")));
        assertFalse(rows.get(1).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("invalid_date")));
        assertTrue(rows.get(2).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("invalid_date")));
        assertFalse(rows.get(2).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("missing_date")));
        assertTrue(rows.get(3).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("non_positive_amount")));
        assertTrue(rows.get(4).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("missing_amount")));
        assertEquals(List.of("missing_amount"), rows.get(4).getValidationReasons().stream().map(r -> r.getCode()).toList());
        assertTrue(rows.get(5).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("invalid_amount")));
        assertTrue(rows.get(6).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("invalid_amount")));
        assertTrue(rows.get(7).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("missing_description")));
        assertTrue(rows.get(8).getValidationReasons().stream().anyMatch(r -> r.getCode().equals("invalid_transaction_type")));
        assertTrue(rows.get(9).getValidationReasons().size() >= 4);
    }
}
