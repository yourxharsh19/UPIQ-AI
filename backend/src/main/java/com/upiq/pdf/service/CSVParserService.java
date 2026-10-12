package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.exceptions.ParsingException;
import com.upiq.pdf.utils.ParsingUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CSVParserService {

    private final TransactionMappingService mappingService;

    public List<TransactionRequest> parseCSV(MultipartFile file) {
        List<TransactionRequest> transactions = new ArrayList<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            List<CSVRecord> records = csvParser.getRecords();
            log.info("Parsing {} CSV records", records.size());

            for (CSVRecord record : records) {
                try {
                    TransactionRequest tx = parseRecord(record);
                    if (tx != null && tx.getAmount() != null && tx.getAmount() > 0) {
                        transactions.add(tx);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse CSV record (exceptionClass={})", e.getClass().getSimpleName());
                }
            }

        } catch (Exception e) {
            log.error("Error parsing CSV file (exceptionClass={})", e.getClass().getSimpleName());
            throw new ParsingException("Could not parse uploaded CSV", e);
        }

        log.info("Successfully parsed {} transactions from CSV", transactions.size());
        return transactions;
    }

    private TransactionRequest parseRecord(CSVRecord record) {
        TransactionRequest tx = new TransactionRequest();
        tx.setSourceRowIndex(Math.toIntExact(record.getRecordNumber() - 1));

        // Try to extract amount from various possible column names
        String amountStr = getValueIgnoreCase(record, "amount", "value", "transaction_amount", "amt", "total");
        if (amountStr != null && !amountStr.isEmpty()) {
            try {
                tx.setAmount(Double.parseDouble(amountStr.replaceAll("[^0-9.-]", "")));
            } catch (NumberFormatException e) {
                log.warn("Could not parse amount in CSV record");
            }
        }

        // Extract type (income/expense)
        String typeStr = getValueIgnoreCase(record, "type", "transaction_type", "credit_debit", "cd");
        if (typeStr != null) {
            tx.setType(toTransactionType(mappingService.extractType(typeStr)));
        } else {
            // Infer from amount or description
            String description = getValueIgnoreCase(record, "description", "details", "narration", "remarks", "memo");
            if (description != null) {
                tx.setType(toTransactionType(mappingService.extractType(description)));
            } else {
                tx.setType("expense"); // default
            }
        }

        // Extract description
        String description = getValueIgnoreCase(record, "description", "details", "narration", "remarks", "memo", "note");
        if (description != null) {
            tx.setDescription(description.trim());
        }

        // Extract date
        String dateStr = getValueIgnoreCase(record, "date", "transaction_date", "date_time", "timestamp");
        if (dateStr != null) {
            tx.setDate(ParsingUtils.parseDate(dateStr));
        }

        // Extract payment method
        String paymentMethod = getValueIgnoreCase(record, "payment_method", "method", "payment_type", "mode");
        if (paymentMethod != null) {
            tx.setPaymentMethod(mappingService.extractPaymentMethod(paymentMethod));
        }

        // Extract category if available
        String category = getValueIgnoreCase(record, "category", "cat", "transaction_category");
        if (category != null && !category.isEmpty()) {
            tx.setCategory(category.trim());
        }

        return tx;
    }

    private String getValueIgnoreCase(CSVRecord record, String... possibleKeys) {
        for (String key : possibleKeys) {
            try {
                String value = record.get(key);
                if (value != null && !value.trim().isEmpty()) {
                    return value;
                }
            } catch (IllegalArgumentException e) {
                // Try case-insensitive match
                for (String header : record.getParser().getHeaderMap().keySet()) {
                    if (header.equalsIgnoreCase(key)) {
                        return record.get(header);
                    }
                }
            }
        }
        return null;
    }

    private String toTransactionType(String mappedType) {
        return "credit".equalsIgnoreCase(mappedType) ? "income" : "expense";
    }
}

