package com.upiq.pdf.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatementImportResult {
    private int importedCount;
    private int duplicateCount;
    private int rejectedCount;
    private int failedCount;
}
