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
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class CSVParserService {

    private static final Set<String> AMOUNT_HEADERS = Set.of("amount", "amt", "value", "transactionamount", "total");
    private static final Set<String> DEBIT_HEADERS = Set.of(
            "debit", "debitamount", "debitamt", "debitamountinr", "withdraw", "withdrawal",
            "withdrawals", "withdrawalamount", "withdrawalamt", "withdrawn", "withdrawnamount", "dr", "dramount"
    );
    private static final Set<String> CREDIT_HEADERS = Set.of(
            "credit", "creditamount", "creditamt", "creditamountinr", "deposit", "deposits",
            "depositamount", "depositamt", "deposited", "cr", "cramount"
    );

    private static final Pattern VALID_AMOUNT = Pattern.compile(
            "[+-]?(?:(?:\\d+|\\d{1,3}(?:,\\d{3})+|\\d{1,2}(?:,\\d{2})*,\\d{3})(?:\\.\\d*)?|\\.\\d+)"
    );
    private static final Pattern CURRENCY_PREFIX = Pattern.compile("(?i)^(?:₹|\\$|INR|RS\\.?)");
    private static final Pattern CURRENCY_MARKER = Pattern.compile("(?i)(?:₹|\\$|INR|RS\\.?)");

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

        // Try generic amount columns first, then use debit/credit columns when present.
        String amountStr = getValueByHeaderAliases(record, AMOUNT_HEADERS);
        String debitStr = getValueByHeaderAliases(record, DEBIT_HEADERS);
        String creditStr = getValueByHeaderAliases(record, CREDIT_HEADERS);
        Double debitAmount = parseAmountSafely(debitStr, reasons);
        Double creditAmount = parseAmountSafely(creditStr, reasons);

        if (hasPositiveAmount(debitAmount) && hasPositiveAmount(creditAmount)) {
            addReasonIfAbsent(reasons, StatementRowValidationReason.INVALID_AMOUNT);
        } else if ((debitAmount != null && debitAmount < 0) || (creditAmount != null && creditAmount < 0)) {
            tx.setAmount(debitAmount != null && debitAmount < 0 ? debitAmount : creditAmount);
        } else if (hasPositiveAmount(debitAmount)) {
            tx.setAmount(debitAmount);
            tx.setType("expense");
        } else if (hasPositiveAmount(creditAmount)) {
            tx.setAmount(creditAmount);
            tx.setType("income");
        } else if (debitAmount != null || creditAmount != null) {
            tx.setAmount(debitAmount != null ? debitAmount : creditAmount);
        } else {
            tx.setAmount(parseAmountSafely(amountStr, reasons));
        }

        if (tx.getAmount() == null) {
            if (!reasons.contains(StatementRowValidationReason.INVALID_AMOUNT)) {
                addReasonIfAbsent(reasons, StatementRowValidationReason.MISSING_AMOUNT);
            }
        } else if (!Double.isFinite(tx.getAmount())) {
            addReasonIfAbsent(reasons, StatementRowValidationReason.INVALID_AMOUNT);
        } else if (tx.getAmount() <= 0) {
            addReasonIfAbsent(reasons, StatementRowValidationReason.NON_POSITIVE_AMOUNT);
        }

        // Extract type (income/expense)
        String typeStr = getValueIgnoreCase(record, "type", "transaction_type", "credit_debit", "cd");
        if (tx.getType() != null) {
            // A populated debit/credit amount column is the source of the transaction direction.
        } else if (typeStr != null) {
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

    private String getValueByHeaderAliases(CSVRecord record, Set<String> aliases) {
        for (String header : record.getParser().getHeaderMap().keySet()) {
            if (aliases.contains(normalizeHeader(header))) {
                String value = record.get(header);
                if (value != null && !value.trim().isEmpty()) return value;
            }
        }
        return null;
    }

    private String normalizeHeader(String header) {
        return header.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private Double parseAmountSafely(String amount, List<StatementRowValidationReason> reasons) {
        if (amount == null || amount.isBlank()) return null;
        try {
            return parseAmount(amount);
        } catch (NumberFormatException e) {
            addReasonIfAbsent(reasons, StatementRowValidationReason.INVALID_AMOUNT);
            return null;
        }
    }

    private Double parseAmount(String amount) {
        String normalizedAmount = stripCurrencyPrefix(amount);
        if (!VALID_AMOUNT.matcher(normalizedAmount).matches()) throw new NumberFormatException("Invalid amount format");
        double parsed = Double.parseDouble(normalizedAmount.replace(",", ""));
        if (!Double.isFinite(parsed)) throw new NumberFormatException("Amount is not finite");
        return parsed;
    }

    private String stripCurrencyPrefix(String amount) {
        String value = amount.trim();
        String sign = "";
        if (!value.isEmpty() && (value.charAt(0) == '+' || value.charAt(0) == '-')) {
            sign = value.substring(0, 1);
            value = value.substring(1).trim();
        }

        var currencyMatcher = CURRENCY_PREFIX.matcher(value);
        if (currencyMatcher.find()) value = value.substring(currencyMatcher.end()).trim();

        if (!value.isEmpty() && (value.charAt(0) == '+' || value.charAt(0) == '-')) {
            if (!sign.isEmpty()) throw new NumberFormatException("Multiple signs in amount");
            sign = value.substring(0, 1);
            value = value.substring(1).trim();
        }
        if (CURRENCY_MARKER.matcher(value).find()) throw new NumberFormatException("Currency marker must appear once as a prefix");
        return sign + value;
    }

    private boolean hasPositiveAmount(Double amount) {
        return amount != null && amount > 0;
    }

    private void addReasonIfAbsent(List<StatementRowValidationReason> reasons, StatementRowValidationReason reason) {
        if (!reasons.contains(reason)) reasons.add(reason);
    }

    private String toTransactionType(String mappedType) {
        return "credit".equalsIgnoreCase(mappedType) ? "income" : "expense";
    }
}

