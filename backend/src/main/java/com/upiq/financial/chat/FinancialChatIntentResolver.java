package com.upiq.financial.chat;

import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import org.springframework.stereotype.Component;

import java.time.Month;
import java.time.YearMonth;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Bounded deterministic chat routing; this component never calculates financial values. */
@Component
public class FinancialChatIntentResolver {

    private static final String CATEGORY_TOTAL = "CATEGORY_EXPENSE_TOTAL";
    private static final List<String> CATEGORIES = List.of(
            "Bills & Utilities", "Cash Withdrawal", "Entertainment", "Groceries", "Education",
            "Insurance", "Transport", "Shopping", "Health", "Travel", "Rent", "Fuel", "Food", "Other");
    private static final Pattern MONTH_PATTERN = Pattern.compile(
            "\\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|"
                    + "september|sept|sep|october|oct|november|nov|december|dec)\\b(?:\\s+(20\\d{2}))?",
            Pattern.CASE_INSENSITIVE);
    private static final List<String> GENERAL_TERMS = List.of("budget", "compound interest", "inflation",
            "credit score", "emergency fund", "savings", "investment", "tax", "loan", "interest rate",
            "diversification", "mutual fund", "index fund", "fixed deposit", "credit card",
            "credit utilization", "stock market", "retirement", "mortgage", "insurance", "dividend",
            "asset allocation", "personal finance", "save money", "50/30/20");
    private static final Map<String, Month> MONTHS = Map.ofEntries(
            Map.entry("jan", Month.JANUARY), Map.entry("january", Month.JANUARY),
            Map.entry("feb", Month.FEBRUARY), Map.entry("february", Month.FEBRUARY),
            Map.entry("mar", Month.MARCH), Map.entry("march", Month.MARCH),
            Map.entry("apr", Month.APRIL), Map.entry("april", Month.APRIL),
            Map.entry("may", Month.MAY), Map.entry("jun", Month.JUNE), Map.entry("june", Month.JUNE),
            Map.entry("jul", Month.JULY), Map.entry("july", Month.JULY),
            Map.entry("aug", Month.AUGUST), Map.entry("august", Month.AUGUST),
            Map.entry("sep", Month.SEPTEMBER), Map.entry("sept", Month.SEPTEMBER), Map.entry("september", Month.SEPTEMBER),
            Map.entry("oct", Month.OCTOBER), Map.entry("october", Month.OCTOBER),
            Map.entry("nov", Month.NOVEMBER), Map.entry("november", Month.NOVEMBER),
            Map.entry("dec", Month.DECEMBER), Map.entry("december", Month.DECEMBER));

    public Optional<BenchmarkQuestionDefinition> resolve(String question, YearMonth latestAvailableMonth,
                                                           LocalDate earliestTransactionDate) {
        return resolve(question, latestAvailableMonth, earliestTransactionDate, YearMonth.now());
    }

    public boolean isGeneralEducationalQuestion(String question) {
        if (question == null || question.isBlank()) return false;
        String normalized = question.toLowerCase(Locale.ROOT);
        boolean educationalForm = containsAny(normalized, "what is", "what are", "explain", "define",
                "meaning of", "how does", "how do ", "difference between", "differentiate between");
        boolean personalLedgerRequest = containsAny(normalized, " my ", " i spent", " i earned", "my spending",
                "my income", "my expense", "my transaction", "my balance", "my account");
        return educationalForm && !personalLedgerRequest
                && GENERAL_TERMS.stream().anyMatch(normalized::contains);
    }

    Optional<BenchmarkQuestionDefinition> resolve(String question, YearMonth latestAvailableMonth,
                                                   LocalDate earliestTransactionDate, YearMonth calendarMonth) {
        if (question == null || question.isBlank() || latestAvailableMonth == null) {
            return Optional.empty();
        }
        String normalized = question.toLowerCase(Locale.ROOT);
        List<String> categories = categoriesMentioned(normalized);
        boolean comparison = containsAny(normalized, "compare", "versus", " vs ", " than ",
                "change", "trend", "increased", "decreased", "more", "less");
        List<YearMonth> mentionedMonths = resolveMonths(question, calendarMonth);

        if (containsAny(normalized, "largest", "biggest", "highest")
                && containsAny(normalized, "expense", "transaction", "spend")) {
            YearMonth namedPeriod = requestedExplicitPeriod(normalized, mentionedMonths);
            LocalDate first = namedPeriod != null ? namedPeriod.atDay(1) : latestAvailableMonth.atDay(1);
            LocalDate end = namedPeriod != null ? namedPeriod.atEndOfMonth() : latestAvailableMonth.atEndOfMonth();
            return Optional.of(definition("LARGEST_TRANSACTION", question, null, null, "expense",
                    first, end, null, null, 1));
        }

        if (comparison && categories.size() >= 2) {
            YearMonth period = requestedPeriod(normalized, mentionedMonths, latestAvailableMonth);
            return Optional.of(definition("CATEGORY_COMPARE", question, categories.get(0), categories.get(1),
                    "expense", period.atDay(1), period.atEndOfMonth(), null, null, null));
        }

        if (comparison && (mentionedMonths.size() >= 2
                || containsAny(normalized, "last month", "previous month", "trend"))) {
            YearMonth baseline = mentionedMonths.size() >= 2 ? mentionedMonths.get(0) : latestAvailableMonth.minusMonths(1);
            YearMonth current = mentionedMonths.size() >= 2 ? mentionedMonths.get(1) : latestAvailableMonth;
            if (baseline.equals(current)) return Optional.empty();
            boolean income = containsAny(normalized, "income", "earn", "salary");
            String type = income ? "PERIOD_INCOME_COMPARE"
                    : containsAny(normalized, "trend") ? "SPENDING_TREND" : "PERIOD_EXPENSE_COMPARE";
            return Optional.of(definition(type, question, null, null, income ? "income" : "expense",
                    current.atDay(1), current.atEndOfMonth(), baseline.atDay(1), baseline.atEndOfMonth(), null));
        }

        if (categories.size() == 1 && isAmountQuestion(normalized)
                && containsAny(normalized, "spend", "spent", "expense", "cost", "much")) {
            YearMonth period = requestedPeriod(normalized, mentionedMonths, latestAvailableMonth);
            return Optional.of(definition(CATEGORY_TOTAL, question, categories.get(0), null, "expense",
                    period.atDay(1), period.atEndOfMonth(), null, null, null));
        }

        YearMonth period = requestedPeriod(normalized, mentionedMonths, latestAvailableMonth);
        if (isSummaryQuestion(normalized)) {
            return Optional.of(definition("NET_BALANCE", question, null, null, null,
                    period.atDay(1), period.atEndOfMonth(), null, null, null));
        }
        if (containsAny(normalized, "net balance", "savings rate")) {
            return Optional.of(definition("NET_BALANCE", question, null, null, null,
                    period.atDay(1), period.atEndOfMonth(), null, null, null));
        }
        if (isAmountQuestion(normalized) && containsAny(normalized, "income", "earn", "salary")) {
            return Optional.of(definition("TOTAL_INCOME", question, null, null, "income",
                    period.atDay(1), period.atEndOfMonth(), null, null, null));
        }
        if ((isAmountQuestion(normalized) || containsAny(normalized, "analyze", "analyse"))
                && containsAny(normalized, "expense", "spend", "spent", "spending", "paid")) {
            return Optional.of(definition("TOTAL_EXPENSE", question, null, null, "expense",
                    period.atDay(1), period.atEndOfMonth(), null, null, null));
        }
        return Optional.empty();
    }

    private static BenchmarkQuestionDefinition definition(String type, String text, String category,
                                                           String comparisonCategory, String transactionType,
                                                           LocalDate start, LocalDate end,
                                                           LocalDate compareStart, LocalDate compareEnd, Integer limit) {
        return BenchmarkQuestionDefinition.builder()
                .id("financial-chat")
                .text(text)
                .calculationType(type)
                .category(category)
                .compareCategory(comparisonCategory)
                .transactionType(transactionType)
                .startDate(start.toString())
                .endDate(end.toString())
                .compareStartDate(compareStart == null ? null : compareStart.toString())
                .compareEndDate(compareEnd == null ? null : compareEnd.toString())
                .limit(limit)
                .build();
    }

    private static List<String> categoriesMentioned(String question) {
        String normalizedQuestion = question.replace("&", "and");
        List<CategoryMention> matches = new ArrayList<>();
        for (String category : CATEGORIES) {
            String normalizedCategory = category.toLowerCase(Locale.ROOT).replace("&", "and");
            Matcher matcher = Pattern.compile("(?<![a-z0-9])" + Pattern.quote(normalizedCategory)
                    + "(?![a-z0-9])").matcher(normalizedQuestion);
            if (matcher.find()) {
                matches.add(new CategoryMention(category, matcher.start()));
            }
        }
        return matches.stream().sorted(Comparator.comparingInt(CategoryMention::position))
                .map(CategoryMention::name).toList();
    }

    private static List<YearMonth> resolveMonths(String question, YearMonth calendarMonth) {
        List<YearMonth> months = new ArrayList<>();
        Matcher matcher = MONTH_PATTERN.matcher(question);
        while (matcher.find()) {
            Month month = MONTHS.get(matcher.group(1).toLowerCase(Locale.ROOT));
            int year = matcher.group(2) == null ? calendarMonth.getYear() : Integer.parseInt(matcher.group(2));
            months.add(YearMonth.of(year, month));
        }
        months.sort(Comparator.naturalOrder());
        return months;
    }

    private static YearMonth requestedPeriod(String normalized, List<YearMonth> months, YearMonth latest) {
        if (containsAny(normalized, "last month", "previous month") && months.isEmpty()) {
            return latest.minusMonths(1);
        }
        YearMonth explicit = requestedExplicitPeriod(normalized, months);
        return explicit == null ? latest : explicit;
    }

    private static YearMonth requestedExplicitPeriod(String normalized, List<YearMonth> months) {
        boolean explicitlyPlacedMonth = normalized.matches(".*\\b(in|during|for|about)\\s+"
                + "(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|"
                + "september|sept|sep|october|oct|november|nov|december|dec)\\b.*")
                || normalized.matches(".*\\b(analyze|analyse)\\s+(?:my\\s+)?"
                + "(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|"
                + "september|sept|sep|october|oct|november|nov|december|dec)\\b.*");
        return explicitlyPlacedMonth && !months.isEmpty() ? months.get(0) : null;
    }

    private static boolean isAmountQuestion(String normalized) {
        return normalized.matches(".*\\b(how much|what was|what is|what's|show me|total)\\b.*");
    }

    private static boolean isSummaryQuestion(String normalized) {
        boolean summaryForm = containsAny(normalized, "summarize", "summarise", "summary", "overview");
        boolean financialScope = containsAny(normalized, "spend", "expense", "income", "cash flow",
                "transaction", "financial", "net balance");
        return summaryForm && financialScope;
    }

    private static boolean containsAny(String value, String... signals) {
        for (String signal : signals) if (value.contains(signal)) return true;
        return false;
    }

    private record CategoryMention(String name, int position) { }
}
