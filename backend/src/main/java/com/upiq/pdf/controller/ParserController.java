package com.upiq.pdf.controller;

import com.upiq.auth.model.User;
import com.upiq.config.ApiResponse;
import com.upiq.pdf.dto.ParsingResponse;
import com.upiq.pdf.dto.StatementImportResult;
import com.upiq.pdf.service.ParserService;
import com.upiq.pdf.service.StatementImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class ParserController {

        private final ParserService parserService;
        private final StatementImportService statementImportService;

        /**
         * Upload and parse a transaction file (PDF or CSV)
         * 
         * @param file The transaction file to parse (PDF or CSV)
         * @return ApiResponse containing parsed transactions and statistics
         */
        @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<ParsingResponse>> uploadAndParse(
                        @RequestParam("file") MultipartFile file,
                        @AuthenticationPrincipal User user) {
                log.info("Received statement upload ({} bytes)", file.getSize());

                ParsingResponse response = parserService.parseFile(file);

                ApiResponse<ParsingResponse> apiResponse = ApiResponse.<ParsingResponse>builder()
                                .success(true)
                                .data(response)
                                .message("File parsed successfully")
                                .build();

                return ResponseEntity.ok(apiResponse);
        }

        /** Parse and idempotently import rows from the original statement for the authenticated user. */
        @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<StatementImportResult>> importStatement(
                        @RequestParam("file") MultipartFile file,
                        @AuthenticationPrincipal User user) {
                StatementImportResult result = statementImportService.importStatement(file, user.getId());
                return ResponseEntity.ok(ApiResponse.success(result, "Statement import processed"));
        }

        /**
         * Health check endpoint
         */
        @GetMapping("/health")
        public ResponseEntity<ApiResponse<String>> health() {
                ApiResponse<String> response = ApiResponse.<String>builder()
                                .success(true)
                                .data("UPIQ-PDFParser-Service is running")
                                .message("Service is healthy")
                                .build();
                return ResponseEntity.ok(response);
        }
}
