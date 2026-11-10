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
public class StatementRow {
    private Integer sourceRowIndex;
    private TransactionRequest transaction;
    @Builder.Default
    private List<StatementRowValidationReason> validationReasons = List.of();

    public boolean isValid() {
        return transaction != null && (validationReasons == null || validationReasons.isEmpty());
    }
}
