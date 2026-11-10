package com.upiq.pdf.service;

import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.dto.StatementRow;
import com.upiq.pdf.dto.StatementRowValidationReason;
import com.upiq.pdf.exceptions.ParsingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

        List<StatementRow> rows;

        try {
            if (validationService.isPDF(file)) {
                log.info("Parsing uploaded PDF");
                rows = pdfParserService.parsePDFRows(file);
            } else if (validationService.isCSV(file)) {
                log.info("Parsing uploaded CSV");
                rows = csvParserService.parseCSVRows(file);
            } else {
                throw new ParsingException("Unsupported file type. Only PDF and CSV files are allowed");
            }

        } catch (ParsingException e) {
            log.warn("Statement parsing failed (exceptionClass={})", e.getClass().getSimpleName());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected statement parsing error (exceptionClass={})", e.getClass().getSimpleName());
            throw new ParsingException("Could not parse uploaded statement", e);
        }

        List<TransactionRequest> transactions = rows.stream().filter(StatementRow::isValid)
                .map(StatementRow::getTransaction).toList();
        int successfulParses = transactions.size();
        int failedParses = rows.size() - successfulParses;
        List<String> errors = rows.stream().filter(row -> !row.isValid())
                .flatMap(row -> row.getValidationReasons().stream())
                .map(StatementRowValidationReason::getCode).distinct().toList();
        String message = String.format(
                "Successfully parsed %d transactions from %s",
                successfulParses,
                file.getOriginalFilename()
        );

        return ParsingResponse.builder()
                .totalTransactions(rows.size())
                .successfulParses(successfulParses)
                .failedParses(failedParses)
                .transactions(transactions)
                .rows(rows)
                .errors(errors)
                .message(message)
                .build();
    }
}

