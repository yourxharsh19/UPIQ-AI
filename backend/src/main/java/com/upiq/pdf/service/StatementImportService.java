package com.upiq.pdf.service;

import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.StatementImportResult;
import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.dto.StatementRow;
import com.upiq.pdf.dto.StatementRowValidationReason;
import com.upiq.transaction.dto.CreateTransactionRequest;
import com.upiq.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class StatementImportService {

    private final ParserService parserService;
    private final TransactionService transactionService;

    public StatementImportResult importStatement(MultipartFile file, Long userId) {
        String fingerprint = fingerprint(file);
        ParsingResponse parsed = parserService.parseFile(file);
        int imported = 0;
        int duplicates = 0;
        int rejected = 0;
        int failed = 0;

        List<StatementRow> rows = parsed.getRows();
        boolean rowDetailsProvided = rows != null && !rows.isEmpty();
        if (!rowDetailsProvided) {
            rows = new ArrayList<>();
            if (parsed.getTransactions() != null) {
                for (TransactionRequest tx : parsed.getTransactions()) rows.add(StatementRow.builder()
                        .sourceRowIndex(tx == null ? null : tx.getSourceRowIndex()).transaction(tx)
                        .validationReasons(StatementRowValidator.validate(tx)).build());
            }
        }
        List<StatementRow> rejectedRows = new ArrayList<>();
        List<StatementRow> failedRows = new ArrayList<>();

        for (StatementRow statementRow : rows) {
            TransactionRequest row = statementRow.getTransaction();
            List<StatementRowValidationReason> rowReasons;
            if (rowDetailsProvided) {
                // ParserService supplies the canonical reasons used by preview; preserve them verbatim.
                rowReasons = statementRow.getValidationReasons() == null
                        ? List.of(StatementRowValidationReason.PARSING_FAILURE)
                        : statementRow.getValidationReasons();
            } else {
                rowReasons = StatementRowValidator.validate(row);
            }
            if (!rowReasons.isEmpty() || !isImportable(row)) {
                if (rowReasons.isEmpty()) {
                    rowReasons = List.of(StatementRowValidationReason.PARSING_FAILURE);
                    statementRow.setValidationReasons(rowReasons);
                }
                rejected++;
                rejectedRows.add(statementRow);
                continue;
            }
            try {
                CreateTransactionRequest request = new CreateTransactionRequest();
                request.setAmount(row.getAmount());
                request.setType(row.getType().toLowerCase(Locale.ROOT));
                request.setCategory(row.getCategory());
                request.setDescription(row.getDescription().trim());
                request.setPaymentMethod(row.getPaymentMethod());
                request.setDate(row.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

                String identity = fingerprint + ":" + row.getSourceRowIndex();
                if (transactionService.addImportedTransaction(request, userId, identity)) imported++;
                else duplicates++;
            } catch (RuntimeException e) {
                // Continue importing other rows; retries remain safe because successful rows have identities.
                failed++;
                statementRow.setValidationReasons(List.of(StatementRowValidationReason.PERSISTENCE_FAILURE));
                failedRows.add(statementRow);
            }
        }

        // Legacy parsers may report failed records without enough source information to construct a row.
        int unidentifiedFailures = rowDetailsProvided ? 0 : Math.max(0, parsed.getFailedParses());
        for (int i = 0; i < unidentifiedFailures; i++) {
            rejectedRows.add(StatementRow.builder().sourceRowIndex(null).transaction(null)
                    .validationReasons(List.of(StatementRowValidationReason.UNIDENTIFIED_PARSE_FAILURE)).build());
            rejected++;
        }
        return StatementImportResult.builder()
                .importedCount(imported)
                .duplicateCount(duplicates)
                .rejectedCount(rejected)
                .failedCount(failed)
                .rejectedRows(rejectedRows)
                .failedRows(failedRows)
                .build();
    }

    private boolean isImportable(TransactionRequest row) {
        return row != null && row.getSourceRowIndex() != null && row.getAmount() != null
                && Double.isFinite(row.getAmount()) && row.getAmount() > 0
                && row.getType() != null && ("income".equalsIgnoreCase(row.getType()) || "expense".equalsIgnoreCase(row.getType()))
                && row.getDescription() != null && !row.getDescription().isBlank() && row.getDate() != null;
    }

    private String fingerprint(MultipartFile file) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(file.getBytes());
            return HexFormat.of().formatHex(digest);
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new IllegalArgumentException("Unable to fingerprint the uploaded statement", e);
        }
    }
}
