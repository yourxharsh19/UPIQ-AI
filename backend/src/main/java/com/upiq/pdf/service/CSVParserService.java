package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.dto.StatementRow;
import com.upiq.pdf.dto.StatementRowValidationReason;
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
        return parseCSVRows(file).stream()
                .map(StatementRow::getTransaction)
                .filter(tx -> tx != null && tx.getAmount() != null && tx.getAmount() > 0)
                .toList();
    }

    public List<StatementRow> parseCSVRows(MultipartFile file) {
        List<StatementRow> rows = new ArrayList<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            List<CSVRecord> records = csvParser.getRecords();
            log.info("Parsing {} CSV records", records.size());

            for (CSVRecord record : records) {
                try {
                    rows.add(parseRecord(record));
                } catch (Exception e) {
                    int sourceIndex = Math.toIntExact(record.getRecordNumber() - 1);
                    TransactionRequest tx = TransactionRequest.builder().sourceRowIndex(sourceIndex).build();
                    rows.add(StatementRow.builder().sourceRowIndex(sourceIndex).transaction(tx)
                            .validationReasons(List.of(StatementRowValidationReason.PARSING_FAILURE)).build());
                    log.warn("Failed to parse CSV record (exceptionClass={})", e.getClass().getSimpleName());
                }
            }

        } catch (Exception e) {
            log.error("Error parsing CSV file (exceptionClass={})", e.getClass().getSimpleName());
            throw new ParsingException("Could not parse uploaded CSV", e);
        }

        log.info("Parsed {} CSV data rows", rows.size());
        return rows;
    }

    private StatementRow parseRecord(CSVRecord record) {
        TransactionRequest tx = new TransactionRequest();
        int sourceRowIndex = Math.toIntExact(record.getRecordNumber() - 1);
        tx.setSourceRowIndex(sourceRowIndex);
        List<StatementRowValidationReason> reasons = new ArrayList<>();

        // Try to extract amount from various possible column names
        String amountStr = getValueIgnoreCase(record, "amount", "value", "transaction_amount", "amt", "total");
        if (amountStr != null) {
            try {
                String normalizedAmount = amountStr.replaceAll("(?i)\\b(?:inr|rs\\.?)\\s*", "")
                        .replace("₹", "").replace(",", "").trim();
                if (!normalizedAmount.matches("[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)")) throw new NumberFormatException();
                tx.setAmount(Double.parseDouble(normalizedAmount));
            } catch (NumberFormatException e) {
                reasons.add(StatementRowValidationReason.INVALID_AMOUNT);
            }
        }
        if (amountStr == null) reasons.add(StatementRowValidationReason.MISSING_AMOUNT);
        else if (tx.getAmount() == null && !reasons.contains(StatementRowValidationReason.INVALID_AMOUNT)) reasons.add(StatementRowValidationReason.INVALID_AMOUNT);
        else if (tx.getAmount() != null && !Double.isFinite(tx.getAmount())) reasons.add(StatementRowValidationReason.INVALID_AMOUNT);
        else if (tx.getAmount() != null && tx.getAmount() <= 0) reasons.add(StatementRowValidationReason.NON_POSITIVE_AMOUNT);

        // Extract type (income/expense)
        String typeStr = getValueIgnoreCase(record, "type", "transaction_type", "credit_debit", "cd");
        if (typeStr != null) {
            String normalizedType = typeStr.trim().toLowerCase(java.util.Locale.ROOT);
            if (List.of("income", "expense", "credit", "debit", "cr", "dr").contains(normalizedType)) {
                tx.setType(toTransactionType(mappingService.extractType(typeStr)));
            } else {
                tx.setType(typeStr.trim());
                reasons.add(StatementRowValidationReason.INVALID_TRANSACTION_TYPE);
            }
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
        if (description == null || description.isBlank()) reasons.add(StatementRowValidationReason.MISSING_DESCRIPTION);

        // Extract date
        String dateStr = getValueIgnoreCase(record, "date", "transaction_date", "date_time", "timestamp");
        if (dateStr != null && !dateStr.isBlank()) {
            tx.setDate(ParsingUtils.parseDate(dateStr));
            if (tx.getDate() == null) reasons.add(StatementRowValidationReason.INVALID_DATE);
        } else {
            reasons.add(StatementRowValidationReason.MISSING_DATE);
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

        return StatementRow.builder().sourceRowIndex(sourceRowIndex).transaction(tx).validationReasons(reasons).build();
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

