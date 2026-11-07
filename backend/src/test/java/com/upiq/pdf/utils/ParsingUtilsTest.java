package com.upiq.pdf.utils;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class ParsingUtilsTest {
    @Test
    void parsesEverySupportedDateFormat() {
        for (String value : new String[]{"05/09/2026", "05-09-2026", "2026-09-05", "05/09/26",
                "05-09-26", "09/05/2026", "05 Sep 2026", "05 September 2026", "2026/09/05", "05.09.2026",
                "2026-09-05T12:30:00", "2026-09-05"}) {
            assertNotNull(ParsingUtils.parseDate(value), value);
        }
    }

    @Test
    void missingAndMalformedDatesRemainMissing() {
        assertNull(ParsingUtils.parseDate(null));
        assertNull(ParsingUtils.parseDate("  "));
        assertNull(ParsingUtils.parseDate("not a date"));
        assertNull(ParsingUtils.parseDate("31/02/2026"));
        assertNull(ParsingUtils.parseDate("31/02/26"));
    }

    @Test
    void mapsTwoDigitYearsToTheDocumented2000Through2099Window() {
        assertEquals(LocalDateTime.of(2000, 1, 1, 0, 0), ParsingUtils.parseDate("01/01/00"));
        assertEquals(LocalDateTime.of(2099, 12, 31, 0, 0), ParsingUtils.parseDate("31-12-99"));
    }
}
