package com.upiq.pdf.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

class StatementRowTest {
    @Test
    void rowWithoutTransactionIsInvalidEvenWhenThereAreNoReasons() {
        StatementRow row = StatementRow.builder().validationReasons(List.of()).build();

        assertFalse(row.isValid());
    }
}
