package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
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
}
