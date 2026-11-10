package com.upiq.pdf.service;

import com.upiq.pdf.dto.StatementRowValidationReason;
import com.upiq.pdf.dto.TransactionRequest;

import java.util.ArrayList;
import java.util.List;

public final class StatementRowValidator {
    private StatementRowValidator() { }

    public static List<StatementRowValidationReason> validate(TransactionRequest row) {
        List<StatementRowValidationReason> reasons = new ArrayList<>();
        if (row == null || row.getAmount() == null) reasons.add(StatementRowValidationReason.MISSING_AMOUNT);
        else if (!Double.isFinite(row.getAmount())) reasons.add(StatementRowValidationReason.INVALID_AMOUNT);
        else if (row.getAmount() <= 0) reasons.add(StatementRowValidationReason.NON_POSITIVE_AMOUNT);
        if (row == null || row.getType() == null || !("income".equalsIgnoreCase(row.getType()) || "expense".equalsIgnoreCase(row.getType())))
            reasons.add(StatementRowValidationReason.INVALID_TRANSACTION_TYPE);
        if (row == null || row.getDescription() == null || row.getDescription().isBlank())
            reasons.add(StatementRowValidationReason.MISSING_DESCRIPTION);
        if (row == null || row.getDate() == null) reasons.add(StatementRowValidationReason.MISSING_DATE);
        if (row == null || row.getSourceRowIndex() == null) reasons.add(StatementRowValidationReason.MISSING_SOURCE_ROW_INDEX);
        return reasons;
    }
}
