package com.upiq.pdf.service;

import com.upiq.pdf.exceptions.ParsingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class FileValidationService {

    private static final List<String> ALLOWED_CSV_TYPES = Arrays.asList(
            "text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"
    );

    private static final List<String> ALLOWED_PDF_TYPES = Arrays.asList(
            "application/pdf"
    );

    private static final List<String> ALLOWED_CSV_EXTENSIONS = Arrays.asList(".csv", ".txt");
    private static final List<String> ALLOWED_PDF_EXTENSIONS = Arrays.asList(".pdf");

    @Value("${app.file.max-size:10485760}") // 10MB default
    private long maxFileSize;

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ParsingException("File is empty or null");
        }

        if (file.getSize() > maxFileSize) {
            throw new ParsingException(
                    String.format("File size %d bytes exceeds maximum allowed size %d bytes", 
                            file.getSize(), maxFileSize)
            );
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (filename == null || filename.isEmpty()) {
            throw new ParsingException("Filename is empty");
        }

        int extensionSeparator = filename.lastIndexOf('.');
        String extension = extensionSeparator >= 0 ? filename.substring(extensionSeparator).toLowerCase() : "";

        // Validate PDF
        if (extension.equals(".pdf")) {
            if (contentType != null && !ALLOWED_PDF_TYPES.contains(contentType)) {
                throw new ParsingException("Invalid PDF file type: " + contentType);
            }
            return;
        }

        // Validate CSV
        if (ALLOWED_CSV_EXTENSIONS.contains(extension)) {
            if (contentType != null && !ALLOWED_CSV_TYPES.contains(contentType) && !contentType.startsWith("text/")) {
                log.warn("Unexpected content type for CSV: {}", contentType);
            }
            return;
        }

        throw new ParsingException("Unsupported file type. Only PDF and CSV files are allowed");
    }

    public boolean isPDF(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) return false;
        return filename.toLowerCase().endsWith(".pdf");
    }

    public boolean isCSV(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) return false;
        String lower = filename.toLowerCase();
        return lower.endsWith(".csv") || lower.endsWith(".txt");
    }
}

