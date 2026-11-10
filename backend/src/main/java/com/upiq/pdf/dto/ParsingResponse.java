package com.upiq.pdf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsingResponse {
    private int totalTransactions;
    private int successfulParses;
    private int failedParses;
    private List<TransactionRequest> transactions;
    /** Every identified source row, including validation rejections. */
    private List<StatementRow> rows;
    private List<String> errors;
    private String message;
}

