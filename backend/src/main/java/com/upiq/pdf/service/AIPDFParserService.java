package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.exceptions.ParsingException;
import com.upiq.pdf.utils.ParsingUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AIPDFParserService {

    private static final Pattern CURRENCY_PATTERN = Pattern.compile("(?:₹|rs\\.?|inr)\\s*([\\d,]+(?:\\.\\d{1,2})?)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DATE_PATTERN = Pattern.compile(
            // Matches: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, yyyy-mm-dd (with optional
            // spaces)
            "\\b(\\d{1,2}\\s*[/\\.-]\\s*\\d{1,2}\\s*[/\\.-]\\s*\\d{2,4})\\b|\\b(\\d{4}\\s*-\\s*\\d{1,2}\\s*-\\s*\\d{1,2})\\b|"
                    +
                    // Matches: dd Mon yyyy, dd Month yyyy (with optional commas)
                    "(\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s*[,\\s]+\\s*\\d{2,4})",
            Pattern.CASE_INSENSITIVE);

    // Fixed: Restored "Paid to" triggers but restricted Bank Name matching to avoid
    // false positives.
    // Matches "Paid to HDFC", "Paid to Bank of India", "Paid to My Bank".
    // Does NOT match "Paid to Zomato ... okhdfcbank" (because of non-greedy
    // matching and whitespace limits).
    private static final Pattern BANK_PATTERN = Pattern.compile(
            "(?i)(?:paid to|payment to|credited to|credit to)\\s+" +
                    "(?:mybankname|bank\\s+of\\s+\\w+|state\\s+bank|hdfc|icici|axis|sbi|pnb|kotak|yes\\s+bank|idfc|hsbc|citibank|union\\s+bank|canara\\s+bank|central\\s+bank|indusind|rbl|federal\\s+bank|(?:[\\w']+\\s+){0,2}bank\\b)");

    private static final Set<String> IGNORE_PATTERNS = Set.of("opening balance", "closing balance", "date & time",
            "page", "statement");

    // Helper to create robust case-insensitive English formatters
    private static DateTimeFormatter createFormatter(String pattern) {
        return new DateTimeFormatterBuilder()
                .parseCaseInsensitive()
                .appendPattern(pattern)
                .toFormatter(Locale.ENGLISH);
    }

    // Standard formatters
    private static final List<DateTimeFormatter> DATE_FORMATTERS = Arrays.asList(
            createFormatter("d/M/yyyy"), createFormatter("d-M-yyyy"), createFormatter("d.M.yyyy"),
            createFormatter("d/M/yy"), createFormatter("d-M-yy"), createFormatter("d.M.yy"),
            createFormatter("yyyy-MM-dd"),
            createFormatter("d MMM yyyy"), createFormatter("d MMM yy"),
            createFormatter("d MMM, yyyy"), createFormatter("d MMM, yy"),
            createFormatter("dd MMM yyyy"), createFormatter("dd MMM, yyyy"));

    public List<TransactionRequest> parsePDF(MultipartFile file) {
        log.info("Starting PDF parsing");
        try (InputStream inputStream = file.getInputStream();
                PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {

            String text = new PDFTextStripper().getText(document);
            if (text == null || text.trim().isEmpty()) {
                log.warn("PDF extracted text is empty");
                throw new ParsingException("Empty PDF");
            }
            log.debug("Extracted text length: {}", text.length());
            return parseTransactions(text);
        } catch (IOException e) {
            log.error("Error reading PDF (exceptionClass={})", e.getClass().getSimpleName());
            throw new ParsingException("Could not read uploaded PDF", e);
        }
    }

    private List<TransactionRequest> parseTransactions(String text) {
        // Pre-process: Normalize spaces to ensure regex matching works reliably
        List<String> lines = Arrays.stream(text.split("\\r?\\n"))
                .map(line -> line.replaceAll("[\\u00A0\\s]+", " ").trim())
                .filter(line -> !line.isEmpty() && !IGNORE_PATTERNS.stream().anyMatch(line.toLowerCase()::contains))
                .collect(Collectors.toList());

        log.info("Processing {} lines after filtering", lines.size());

        List<TransactionRequest> transactions = new ArrayList<>();
        List<String> currentBlock = new ArrayList<>();
        LocalDateTime lastSeenDate = null;
        int sourceRowIndex = 0;

        for (String line : lines) {
            // "Sticky Date" logic: if a line is a date, remember it for subsequent blocks
            LocalDateTime foundDate = extractDate(line);
            if (foundDate != null) {
                lastSeenDate = foundDate;
            }

            String lower = line.toLowerCase();
            // Robust start detection logic (contains)
            boolean isStart = lower.contains("paid to") || lower.contains("received from")
                    || (lower.contains("debited") && !lower.contains("debited from"))
                    || lower.contains("credited to")
                    || lower.contains("sent to") || lower.contains("purchase")
                    || lower.contains("payment to");

            if (isStart && !currentBlock.isEmpty()) {
                addTx(transactions, currentBlock, lastSeenDate, sourceRowIndex++);
                currentBlock.clear();
            }
            currentBlock.add(line);
        }
        addTx(transactions, currentBlock, lastSeenDate, sourceRowIndex);

        log.info("Parsed {} transactions", transactions.size());
        return transactions;
    }

    private void addTx(List<TransactionRequest> transactions, List<String> block, LocalDateTime lastSeenDate, int sourceRowIndex) {
        TransactionRequest tx = parseBlock(block, lastSeenDate);
        if (tx != null) {
            tx.setSourceRowIndex(sourceRowIndex);
            if (isValid(tx)) {
                transactions.add(tx);
            } else {
                log.info("Dropping invalid parsed transaction");
            }
        }
    }

    TransactionRequest parseBlock(List<String> block) {
        return parseBlock(block, null);
    }

    TransactionRequest parseBlock(List<String> block, LocalDateTime lastSeenDate) {
        if (block == null || block.isEmpty())
            return null;
        String combined = String.join(" ", block);
        String lower = combined.toLowerCase();

        if (lower.contains("paid to and") && lower.contains("received from and"))
            return null;

        String type = determineTransactionType(combined);
        if ("UNKNOWN".equals(type))
            return null;

        String finalType = "CREDIT".equals(type) ? "income" : "expense";
        Double amount = extractAmount(combined);
        if (amount == null)
            return null;

        TransactionRequest tx = new TransactionRequest();
        tx.setType(finalType);
        tx.setAmount(amount);

        // Try to find date in the block first; fallback to sticky date
        LocalDateTime extractedDate = extractDate(combined);
        if (extractedDate == null) {
            extractedDate = lastSeenDate;
        }
        tx.setDate(extractedDate);

        if (extractedDate == null) {
            log.warn("Transaction parsed without a date");
        }

        tx.setDescription(extractDescription(block, type));
        tx.setPaymentMethod(lower.contains("cash") ? "CASH" : "UPI");

        return tx;
    }

    String determineTransactionType(String text) {
        String lower = text.toLowerCase();
        // Credit
        if (lower.contains("received from") || lower.contains("credited") ||
                lower.contains("refund") || lower.contains("cashback") ||
                lower.contains("paid to you"))
            return "CREDIT";

        if (BANK_PATTERN.matcher(text).find())
            return "CREDIT";

        // Debit
        if (lower.contains("paid to") || lower.contains("debited") ||
                lower.contains("sent to") || lower.contains("purchase") ||
                lower.contains("payment to"))
            return "DEBIT";

        return "UNKNOWN";
    }

    private String extractDescription(List<String> block, String type) {
        String combined = String.join(" ", block).trim();
        String name = null;
        String lower = combined.toLowerCase();

        if ("DEBIT".equals(type)) {
            Pattern p = Pattern.compile(
                    "(?:paid to|sent to|transfer to|payment to|pay to)\\s+([A-Za-z0-9\\s&.,'-]+?)(?:\\s+(?:upi|ref|id|amount|rs|inr|₹|\\d{12}|\\d{1,2}[/-]\\d{1,2})|$)",
                    Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(combined);
            if (m.find()) {
                name = cleanName(m.group(1), "");
                if (!name.isEmpty() && !name.toLowerCase().matches(".*(?:bank|account|wallet|your).*")) {
                    return "Paid to " + name;
                }
            }

            String[] debitKeywords = { "paid to", "sent to", "debited", "purchase", "payment to" };
            for (String line : block) {
                for (String kw : debitKeywords) {
                    if (line.toLowerCase().contains(kw)) {
                        String clean = cleanName(line, kw);
                        if (!clean.isEmpty())
                            return formatDesc(kw, clean);
                    }
                }
            }
        } else { // CREDIT
            // 1. Try "Paid by" pattern first (most specific for income)
            Pattern paidByPattern = Pattern.compile(
                    "paid\\s+by\\s+([A-Za-z0-9\\s&.,'-]+?)(?:\\s*-|\\s+(?:paid|to|upi|ref|id|amount|rs|inr|₹|\\d{12}|\\d{1,2}[/-]\\d{1,2})|$)",
                    Pattern.CASE_INSENSITIVE);
            Matcher paidByMatcher = paidByPattern.matcher(combined);
            if (paidByMatcher.find()) {
                name = cleanName(paidByMatcher.group(1), "");
                if (!name.isEmpty() && !name.toLowerCase().matches(".*(?:bank|account|wallet|your).*")) {
                    return "Received from " + name;
                }
            }

            // 2. Try "Received from" / "Credited from" patterns
            Pattern receivedPattern = Pattern.compile(
                    "(?:received from|credited from|credit from)\\s+([A-Za-z0-9\\s&.,'-]+?)(?:\\s*-|\\s+(?:upi|ref|id|amount|rs|inr|₹|\\d{12}|\\d{1,2}[/-]\\d{1,2})|$)",
                    Pattern.CASE_INSENSITIVE);
            Matcher receivedMatcher = receivedPattern.matcher(combined);
            if (receivedMatcher.find()) {
                name = cleanName(receivedMatcher.group(1), "");
                if (!name.isEmpty() && !name.toLowerCase().matches(".*(?:bank|account|wallet|your).*")) {
                    return "Received from " + name;
                }
            }

            // 3. Fallback: Check each line for keywords
            for (String line : block) {
                String lineLower = line.toLowerCase();

                // Check for "paid by"
                if (lineLower.contains("paid by")) {
                    String clean = cleanName(line, "paid by");
                    if (!clean.isEmpty() && !clean.toLowerCase().matches(".*(?:bank|account|wallet).*"))
                        return "Received from " + clean;
                }

                // Check for "received from"
                if (lineLower.contains("received from")) {
                    String clean = cleanName(line, "received from");
                    if (!clean.isEmpty() && !clean.toLowerCase().matches(".*(?:bank|account|wallet).*"))
                        return "Received from " + clean;
                }

                // Check for refund/cashback
                if (lineLower.contains("refund") || lineLower.contains("cashback")) {
                    String clean = cleanName(line, lineLower.contains("refund") ? "refund" : "cashback");
                    if (!clean.isEmpty())
                        return "Received from " + clean;
                }
            }

            // 4. Last Resort: "Paid to {My Bank}" -> "Deposit to {My Bank}"
            if (lower.startsWith("paid to") || lower.startsWith("payment to")) {
                for (String line : block) {
                    String lineLower = line.toLowerCase();
                    if (lineLower.contains("paid to")) {
                        String clean = cleanName(line, "paid to");
                        if (!clean.isEmpty())
                            return "Deposit to " + clean;
                    }
                    if (lineLower.contains("payment to")) {
                        String clean = cleanName(line, "payment to");
                        if (!clean.isEmpty())
                            return "Deposit to " + clean;
                    }
                }
            }
        }

        return "Transaction";
    }

    private String formatDesc(String keyword, String name) {
        String cap = Character.toUpperCase(keyword.charAt(0)) + keyword.substring(1);
        return cap + " " + name;
    }

    private boolean isNoise(String line) {
        return CURRENCY_PATTERN.matcher(line).find() || DATE_PATTERN.matcher(line).find()
                || line.toLowerCase().contains("upi id");
    }

    private String cleanName(String line, String keyword) {
        int idx = 0;
        if (!keyword.isEmpty()) {
            idx = line.toLowerCase().indexOf(keyword);
            if (idx == -1)
                return line.trim();
            idx += keyword.length();
        }

        String raw = line.substring(idx).trim();
        return raw.replaceAll("(?i)(?:upi|ref|id|rs|inr|₹).*$", "")
                .replaceAll("\\d.*$", "")
                .replaceAll("[-–].*$", "")
                .trim();
    }

    private Double extractAmount(String text) {
        Matcher m = CURRENCY_PATTERN.matcher(text);
        while (m.find()) {
            try {
                String val = m.group(1).replace(",", "");
                double d = Double.parseDouble(val);
                if (d > 0 && d < 1000000)
                    return d;
            } catch (Exception e) {
                /* ignore */ }
        }
        return null;
    }

    private LocalDateTime extractDate(String text) {
        Matcher m = DATE_PATTERN.matcher(text);
        if (m.find()) {
            // Group 1: Numeric (dd/mm/yyyy)
            // Group 2: ISO (yyyy-mm-dd)
            // Group 3: Text Month (dd Mon yyyy)

            try {
                if (m.group(3) != null) {
                    // Text Month Logic
                    String s = m.group(3);
                    // Normalize: remove dots, commas, extra spaces -> "01 Oct 2025"
                    s = s.replaceAll("[,\\.\\-]", " ").replaceAll("\\s+", " ").trim();
                    log.debug("Normalized text-month date");

                    List<DateTimeFormatter> textFormatters = Arrays.asList(
                            createFormatter("d MMM yyyy"),
                            createFormatter("d MMM yy"),
                            createFormatter("dd MMM yyyy"));

                    for (DateTimeFormatter fmt : textFormatters) {
                        try {
                            return LocalDate.parse(s, fmt).atStartOfDay();
                        } catch (Exception ignored) {
                        }
                    }
                } else if (m.group(2) != null) {
                    // ISO Logic
                    String s = m.group(2).replaceAll("\\s+", ""); // remove spaces "2023 - 10 - 26"
                    return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
                } else if (m.group(1) != null) {
                    // Numeric Logic
                    String s = m.group(1);
                    // Normalize: replace . - with / -> "26/10/2023"
                    s = s.replaceAll("[\\.\\-]", "/").replaceAll("\\s+", "");
                    log.debug("Normalized numeric date");

                    List<DateTimeFormatter> numericFormatters = Arrays.asList(
                            createFormatter("d/M/yyyy"),
                            createFormatter("d/M/yy"));

                    for (DateTimeFormatter fmt : numericFormatters) {
                        try {
                            return LocalDate.parse(s, fmt).atStartOfDay();
                        } catch (Exception ignored) {
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not parse extracted statement date (exceptionClass={})",
                        e.getClass().getSimpleName());
            }
        }
        log.warn("Could not find a date in parsed statement text");
        return null;
    }

    private boolean isValid(TransactionRequest tx) {
        return tx.getAmount() != null;
    }
}
