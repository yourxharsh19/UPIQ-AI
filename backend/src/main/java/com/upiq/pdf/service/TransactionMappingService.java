package com.upiq.pdf.service;

import com.upiq.pdf.dto.TransactionRequest;
import com.upiq.pdf.utils.ParsingUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.math.BigDecimal;

@Slf4j
@Service
public class TransactionMappingService {

    private static final BigDecimal MAX_AMOUNT = new BigDecimal("99999999999999999.99");

    private static final String TYPE_CREDIT = "credit";
    private static final String TYPE_DEBIT = "debit";

    private static final Pattern CURRENCY_AMOUNT_PATTERN = Pattern.compile(
            "(?:₹|rs\\.?|inr)\\s*((?<![\\d.,])[-+]?\\d[\\d,]*(?:\\.\\d{1,2})?(?![\\d.,]))",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DECIMAL_AMOUNT_PATTERN = Pattern.compile(
            "(?<![\\d.,])([-+]?\\d[\\d,]*\\.\\d{1,2})(?![\\d.,])"
    );

    private static final Pattern SMALL_INTEGER_AMOUNT_PATTERN = Pattern.compile(
            "(?<![\\d.,])([-+]?\\d{1,17})(?![\\d.,])"
    );

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})[/-](\\d{1,2})[/-](\\d{2,4})\\b"
    );

    private static final String[] IDENTIFIER_KEYWORDS = {
            "transaction id", "upi txn", "upi transaction id", "utr",
            "reference no", "ref no", "reference id", "upi reference", "order id"
    };

    private static final Pattern UPI_HANDLE_PATTERN = Pattern.compile("[A-Za-z0-9\\.\\-]+@[a-z]+");

    public TransactionRequest mapTransactionBlock(List<String> blockLines) {
        if (blockLines == null || blockLines.isEmpty()) {
            return null;
        }

        String combined = String.join(" ", blockLines);

        BigDecimal amount = extractAmountFromLines(blockLines);
        if (!ParsingUtils.isValidAmount(amount)) {
            amount = extractAmount(combined);
        }

        if (!ParsingUtils.isValidAmount(amount)) {
            return null;
        }

        TransactionRequest tx = new TransactionRequest();
        tx.setAmount(amount);
        tx.setType(determineTypeFromBlock(blockLines, combined));
        tx.setDescription(extractDescriptionFromBlock(blockLines));
        tx.setDate(extractDate(combined));
        tx.setPaymentMethod(extractPaymentMethod(combined));

        return tx;
    }

    public BigDecimal extractAmountFromLines(List<String> blockLines) {
        if (blockLines == null) {
            return BigDecimal.ZERO;
        }

        for (String line : blockLines) {
            if (shouldSkipAmountFromLine(line)) continue;

            BigDecimal amount = extractAmountFromCurrencyLine(line);
            if (ParsingUtils.isValidAmount(amount)) {
                return amount;
            }
        }

        for (String line : blockLines) {
            if (shouldSkipAmountFromLine(line)) continue;

            BigDecimal amount = extractAmount(line);
            if (ParsingUtils.isValidAmount(amount)) {
                return amount;
            }
        }

        return BigDecimal.ZERO;
    }

    private BigDecimal extractAmountFromCurrencyLine(String text) {
        if (text == null) return BigDecimal.ZERO;

        Matcher matcher = CURRENCY_AMOUNT_PATTERN.matcher(text);
        if (matcher.find()) {
            return parseAmount(matcher.group(1));
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal extractAmount(String text) {
        if (text == null || text.isEmpty()) {
            return BigDecimal.ZERO;
        }

        if (shouldSkipAmountFromLine(text)) {
            return BigDecimal.ZERO;
        }

        try {
            Matcher currencyMatcher = CURRENCY_AMOUNT_PATTERN.matcher(text);
            if (currencyMatcher.find()) {
                return parseAmount(currencyMatcher.group(1));
            }

            Matcher decimalMatcher = DECIMAL_AMOUNT_PATTERN.matcher(text);
            if (decimalMatcher.find()) {
                return parseAmount(decimalMatcher.group(1));
            }

            Matcher integerMatcher = SMALL_INTEGER_AMOUNT_PATTERN.matcher(text);
            while (integerMatcher.find()) {
                BigDecimal value = parseAmount(integerMatcher.group(1));
                if (ParsingUtils.isValidAmount(value) && value.compareTo(MAX_AMOUNT) <= 0) {
                    return value;
                }
            }

        } catch (Exception e) {
            log.debug("Could not extract amount from parsed transaction text");
        }

        return BigDecimal.ZERO;
    }

    public String extractType(String text) {
        if (text == null) return TYPE_DEBIT;

        String lower = text.toLowerCase();

        if (lower.contains("credit") || lower.contains("cr") ||
                lower.contains("deposit") || lower.contains("income") ||
                lower.contains("salary") || lower.contains("refund") ||
                lower.contains("paid to you") || lower.contains("received from") ||
                lower.contains("sent to your bank") || lower.contains("to your bank")) {

            return TYPE_CREDIT;
        }

        if (lower.contains("debit") || lower.contains("dr") ||
                lower.contains("withdrawal") || lower.contains("payment") ||
                lower.contains("paid to")) {

            return TYPE_DEBIT;
        }

        return TYPE_DEBIT;
    }

    public String extractDescription(String text) {
        if (text == null) return "";

        String lower = text.toLowerCase();

        int paidIndex = lower.indexOf("paid to");
        int receivedIndex = lower.indexOf("received from");

        if (paidIndex >= 0) return text.substring(paidIndex).trim();
        if (receivedIndex >= 0) return text.substring(receivedIndex).trim();

        String description = text
                .replaceAll("Rs\\.?\\s*[\\d,]+(?:\\.\\d{1,2})?", "")
                .replaceAll("\\s+", " ")
                .trim();

        return description.isEmpty() ? "Transaction" : description;
    }

    public LocalDateTime extractDate(String text) {
        if (text == null) return LocalDateTime.now();

        Matcher matcher = DATE_PATTERN.matcher(text);

        if (matcher.find()) {
            try {
                int day = Integer.parseInt(matcher.group(1));
                int month = Integer.parseInt(matcher.group(2));
                int year = Integer.parseInt(matcher.group(3));

                if (year < 100) year += 2000;

                return LocalDateTime.of(year, month, day, 0, 0);

            } catch (Exception e) {
                log.debug("Could not parse date from parsed transaction text");
            }
        }

        return LocalDateTime.now();
    }

    public String extractPaymentMethod(String text) {
        if (text == null) return "Cash";

        String lower = text.toLowerCase();

        if (lower.contains("upi") || lower.contains("unified payment") ||
                lower.contains("gpay") || lower.contains("google pay") ||
                containsUpiHandle(text)) {
            return "UPI";
        }

        if (lower.contains("card") || lower.contains("visa") ||
                lower.contains("mastercard") || lower.contains("debit card") ||
                lower.contains("credit card")) {
            return "Card";
        }

        if (lower.contains("net banking") || lower.contains("neft") ||
                lower.contains("rtgs") || lower.contains("imps")) {
            return "Net Banking";
        }

        return "Cash";
    }

    private String determineTypeFromBlock(List<String> lines, String combined) {
        String lower = combined.toLowerCase();

        if (containsAny(lower,
                "received from", "added to", "credited", "refund", "refunded",
                "cashback", "paid to you", "sent to your bank", "to your bank",
                "received in bank")) {
            return TYPE_CREDIT;
        }

        if (containsAny(lower,
                "paid to", "debited from", "sent to", "payment to", "merchant payment")) {
            return TYPE_DEBIT;
        }

        for (String line : lines) {
            String type = extractType(line);
            if (type != null) return type;
        }

        return TYPE_DEBIT;
    }

    private String extractDescriptionFromBlock(List<String> lines) {
        List<String> cleaned = new ArrayList<>();
        lines.forEach(line -> {
            if (line != null) cleaned.add(line.trim());
        });

        Optional<String> paidTo = cleaned.stream()
                .filter(l -> l.toLowerCase().startsWith("paid to") && !l.toLowerCase().contains("paid to you"))
                .findFirst();

        Optional<String> paidToYou = cleaned.stream()
                .filter(l -> l.toLowerCase().contains("paid to you"))
                .findFirst();

        Optional<String> receivedFrom = cleaned.stream()
                .filter(l -> l.toLowerCase().startsWith("received from"))
                .findFirst();

        Optional<String> fromLine = cleaned.stream()
                .filter(l -> l.toLowerCase().startsWith("from") || l.toLowerCase().contains(" from "))
                .findFirst();

        String sender = fromLine.map(this::extractSenderName).orElse(null);

        String upiInfo = cleaned.stream()
                .filter(l -> l.toLowerCase().contains("upi id"))
                .map(l -> l.replaceFirst("(?i)upi id\\s*:?\\s*", ""))
                .findFirst()
                .orElse(null);

        StringBuilder description = new StringBuilder();

        if (paidToYou.isPresent()) {
            String base = cleanLabel(paidToYou.get());
            description.append(base);

            if (sender != null && !base.toLowerCase().contains("from")) {
                description.append(" from ").append(sender);
            }

        } else if (receivedFrom.isPresent()) {
            description.append(cleanLabel(receivedFrom.get()));

        } else if (paidTo.isPresent()) {
            description.append(cleanLabel(paidTo.get()));

        } else if (sender != null) {
            description.append("From ").append(sender);

        } else if (!cleaned.isEmpty()) {
            description.append(cleaned.get(0));
        }

        if (upiInfo != null && !upiInfo.isBlank()) {
            if (description.length() > 0) {
                description.append(" (").append(upiInfo.trim()).append(")");
            } else {
                description.append(upiInfo.trim());
            }
        }

        return description.toString().isEmpty()
                ? "Transaction"
                : description.toString();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    private boolean shouldSkipAmountFromLine(String text) {
        if (text == null) return true;

        String lower = text.toLowerCase();

        for (String keyword : IDENTIFIER_KEYWORDS) {
            if (lower.contains(keyword)) return true;
        }
        return false;
    }

    private boolean containsUpiHandle(String text) {
        if (text == null) return false;
        return UPI_HANDLE_PATTERN.matcher(text).find();
    }

    private String cleanLabel(String line) {
        if (line == null) return "";
        return line.replaceAll("(?i)(paid to you|paid to|received from)\\s*:?\\s*", "$1 ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String extractSenderName(String line) {
        if (line == null) return null;

        String cleaned = line.replaceFirst("(?i)(from|sender|by)[:\\s]+", "").trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private BigDecimal parseAmount(String candidate) {
        if (candidate == null || candidate.isBlank()) return BigDecimal.ZERO;

        try {
            if (!candidate.matches("[+-]?(?:\\d+|\\d{1,3}(?:,\\d{3})+|\\d{1,2}(?:,\\d{2})*,\\d{3})(?:\\.\\d{1,2})?")) return BigDecimal.ZERO;
            BigDecimal value = new BigDecimal(candidate.replace(",", ""));
            if (!ParsingUtils.isValidAmount(value) || value.compareTo(MAX_AMOUNT) > 0) return BigDecimal.ZERO;
            return value;
        } catch (NumberFormatException ex) {
            return BigDecimal.ZERO;
        }
    }
}

