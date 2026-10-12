package com.upiq.pdf.service;

import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.exceptions.ParsingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParserService {

    private final FileValidationService validationService;
    private final AIPDFParserService pdfParserService;
    private final CSVParserService csvParserService;

    public ParsingResponse parseFile(MultipartFile file) {
        // Validate file first
        validationService.validateFile(file);

        List<TransactionRequest> transactions;
        List<String> errors = new ArrayList<>();
        int successfulParses = 0;
        int failedParses = 0;
        int totalTransactions = 0;

        try {
            if (validationService.isPDF(file)) {
                log.info("Parsing uploaded PDF");
                transactions = pdfParserService.parsePDF(file);
            } else if (validationService.isCSV(file)) {
                log.info("Parsing uploaded CSV");
                transactions = csvParserService.parseCSV(file);
            } else {
                throw new ParsingException("Unsupported file type. Only PDF and CSV files are allowed");
            }

            // Store total count BEFORE filtering
            totalTransactions = transactions.size();

            // Count successful and failed parses
            for (TransactionRequest tx : transactions) {
                if (tx != null && tx.getAmount() != null && tx.getAmount() > 0) {
                    successfulParses++;
                } else {
                    failedParses++;
                    errors.add("Invalid transaction: " + (tx != null ? tx.getDescription() : "null"));
                }
            }

            // Filter out invalid transactions
            transactions.removeIf(tx -> tx == null || tx.getAmount() == null || tx.getAmount() <= 0);

        } catch (ParsingException e) {
            log.warn("Statement parsing failed (exceptionClass={})", e.getClass().getSimpleName());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected statement parsing error (exceptionClass={})", e.getClass().getSimpleName());
            throw new ParsingException("Could not parse uploaded statement", e);
        }

        String message = String.format(
                "Successfully parsed %d transactions from %s",
                successfulParses,
                file.getOriginalFilename()
        );

        return ParsingResponse.builder()
                .totalTransactions(totalTransactions)
                .successfulParses(successfulParses)
                .failedParses(failedParses)
                .transactions(transactions)
                .errors(errors)
                .message(message)
                .build();
    }
}

