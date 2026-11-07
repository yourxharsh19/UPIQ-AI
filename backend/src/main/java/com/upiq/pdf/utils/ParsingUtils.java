package com.upiq.pdf.utils;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoField;
import java.util.Arrays;
import java.util.List;

@Slf4j
public class ParsingUtils {

    private static final List<DateTimeFormatter> DATE_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ofPattern("dd/MM/uuuu").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("dd-MM-uuuu").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("uuuu-MM-dd").withResolverStyle(ResolverStyle.STRICT),
            twoDigitYearFormatter("dd/MM/"),
            twoDigitYearFormatter("dd-MM-"),
            DateTimeFormatter.ofPattern("MM/dd/uuuu").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("dd MMM uuuu").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("dd MMMM uuuu").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("uuuu/MM/dd").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("dd.MM.uuuu").withResolverStyle(ResolverStyle.STRICT)
    );

    public static LocalDateTime parseDate(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        String cleaned = text.trim();

        // Try each formatter
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate date = LocalDate.parse(cleaned, formatter);
                return date.atStartOfDay();
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }

        // Try parsing with time
        try {
            return LocalDateTime.parse(cleaned, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            // Ignore
        }

        try {
            return LocalDateTime.parse(cleaned, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            // Ignore
        }

        log.debug("Could not parse statement date");
        return null;
    }

    public static boolean isValidAmount(Double amount) {
        return amount != null && amount > 0;
    }

    private static DateTimeFormatter twoDigitYearFormatter(String prefix) {
        // Two digit years map into the inclusive 2000–2099 window.
        return new DateTimeFormatterBuilder().appendPattern(prefix)
                .appendValueReduced(ChronoField.YEAR, 2, 2, 2000)
                .toFormatter().withResolverStyle(ResolverStyle.STRICT);
    }
}

