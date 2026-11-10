package com.upiq.pdf.service;

import com.upiq.pdf.exceptions.ParsingException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class FileValidationServiceTest {
    private final FileValidationService service = newValidationService();

    private static FileValidationService newValidationService() {
        FileValidationService service = new FileValidationService();
        ReflectionTestUtils.setField(service, "maxFileSize", 10 * 1024 * 1024L);
        return service;
    }

    @Test
    void extensionlessFilenameProducesParsingException() {
        MockMultipartFile file = new MockMultipartFile("file", "statement", "text/plain", new byte[]{1});
        assertThrows(ParsingException.class, () -> service.validateFile(file));
    }

    @Test
    void unsupportedExtensionProducesParsingException() {
        MockMultipartFile file = new MockMultipartFile("file", "statement.xlsx", "application/octet-stream", new byte[]{1});
        assertThrows(ParsingException.class, () -> service.validateFile(file));
    }

    @Test
    void csvAndPdfExtensionsRemainSupported() {
        assertDoesNotThrow(() -> service.validateFile(new MockMultipartFile("file", "statement.csv", "text/csv", new byte[]{1})));
        assertDoesNotThrow(() -> service.validateFile(new MockMultipartFile("file", "statement.pdf", "application/pdf", new byte[]{1})));
    }
}
