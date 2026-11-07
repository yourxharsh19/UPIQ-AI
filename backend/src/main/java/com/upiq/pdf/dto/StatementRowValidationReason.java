package com.upiq.pdf.dto;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatementRowValidationReason {
    MISSING_DATE("missing_date"),
    INVALID_DATE("invalid_date"),
    MISSING_AMOUNT("missing_amount"),
    INVALID_AMOUNT("invalid_amount"),
    NON_POSITIVE_AMOUNT("non_positive_amount"),
    PARSING_FAILURE("parsing_failure"),
    MISSING_DESCRIPTION("missing_description"),
    INVALID_TRANSACTION_TYPE("invalid_transaction_type"),
    PERSISTENCE_FAILURE("persistence_failure"),
    UNIDENTIFIED_PARSE_FAILURE("unidentified_parse_failure"),
    MISSING_SOURCE_ROW_INDEX("missing_source_row_index");

    private final String code;

    StatementRowValidationReason(String code) { this.code = code; }

    @JsonValue
    public String getCode() { return code; }
}
