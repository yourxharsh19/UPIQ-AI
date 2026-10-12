package com.upiq.pdf.service;

import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.StatementImportResult;
import com.upiq.pdf.dto.TransactionRequest;
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

        for (TransactionRequest row : parsed.getTransactions()) {
            if (!isImportable(row)) {
                rejected++;
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
            }
        }

        rejected += Math.max(0, parsed.getFailedParses());
        return StatementImportResult.builder()
                .importedCount(imported)
                .duplicateCount(duplicates)
                .rejectedCount(rejected)
                .failedCount(failed)
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
