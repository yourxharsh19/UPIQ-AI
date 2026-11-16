package com.upiq.financial.investments;

import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.context.PeriodWindow;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvestmentSuggestionsService {
    private static final String DISCLAIMER = "Educational information only; not personalized professional financial advice. "
            + "Investments can lose value and returns are not guaranteed.";
    private static final String FALLBACK_EXPLANATION = "These educational prompts are based on your recorded current-month cash flow.";
    private final TransactionRepository transactions;
    private final SystemCService systemCService;

    @Transactional(readOnly = true)
    public InvestmentSuggestionsResponse getSuggestions(Long userId) {
        YearMonth month = YearMonth.now();
        LocalDate nextMonth = month.plusMonths(1).atDay(1);
        List<Transaction> rows = transactions.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                month.atDay(1).atStartOfDay(), nextMonth.atStartOfDay().minusNanos(1)).stream()
                .filter(transaction -> transaction.getUserId() != null && transaction.getUserId().equals(userId))
                .filter(transaction -> transaction.getDate() != null && YearMonth.from(transaction.getDate()).equals(month))
                .toList();

        BigDecimal income = sum(rows, "income");
        BigDecimal expenses = sum(rows, "expense");
        BigDecimal surplus = income.subtract(expenses).setScale(2, RoundingMode.HALF_UP);
        BigDecimal savingsRate = income.signum() > 0
                ? surplus.multiply(BigDecimal.valueOf(100)).divide(income, 2, RoundingMode.HALF_UP)
                : null;
        String status = rows.isEmpty() ? "NO_DATA" : surplus.signum() > 0 ? "POSITIVE_SURPLUS" : "NO_SURPLUS";
        List<InvestmentSuggestion> suggestions = suggestions(status);
        String explanation = FALLBACK_EXPLANATION;
        boolean aiGenerated = false;
        if (!rows.isEmpty()) {
            try {
                FinancialContext context = FinancialContext.builder()
                        .contextVersion(FinancialContext.CONTEXT_VERSION)
                        .source(FinancialContext.SOURCE)
                        .verified(true)
                        .calculationType("INVESTMENT_EDUCATION_CONTEXT")
                        .transactionType("income_and_expense")
                        .period(PeriodWindow.builder().start(month.atDay(1)).end(month.atEndOfMonth()).build())
                        .facts(FinancialFacts.builder().totalIncome(income).totalExpense(expenses)
                                .netBalance(surplus).build())
                        .definitions(Map.of(
                                "total_income", "verified sum of this user's current-month income transactions",
                                "total_expense", "verified sum of this user's current-month expense transactions",
                                "net_balance", "verified current-month income minus expenses"))
                        .build();
                var result = systemCService.answer(
                        "Provide one brief, neutral explanation of why reviewing cash flow and liquidity is useful "
                                + "before considering investments. Do not calculate or state figures, returns, "
                                + "percentages, asset classes, products, allocations, or personalized advice.", context);
                if (isSafeExplanation(result == null ? null : result.getAnswer())) {
                    explanation = result.getAnswer().trim();
                    aiGenerated = true;
                }
            } catch (RuntimeException ignored) {
                // Deterministic suggestions remain available if the explanation service is unavailable.
            }
        }
        return InvestmentSuggestionsResponse.builder().month(month).income(income).expenses(expenses)
                .monthlySurplus(surplus).savingsRatePercentage(savingsRate).cashFlowStatus(status)
                .suggestions(suggestions).explanation(explanation).aiGenerated(aiGenerated)
                .disclaimer(DISCLAIMER).build();
    }

    private static BigDecimal sum(List<Transaction> rows, String type) {
        return rows.stream()
                .filter(row -> row.getType() != null && row.getType().equalsIgnoreCase(type))
                .map(Transaction::getAmount)
                .filter(amount -> amount != null && amount.signum() > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static List<InvestmentSuggestion> suggestions(String status) {
        return switch (status) {
            case "POSITIVE_SURPLUS" -> List.of(
                    new InvestmentSuggestion("cash-flow-positive", "Review your financial foundation",
                            "Your recorded month has positive cash flow. Before considering investments, review emergency savings, near-term needs, and any high-interest debt."),
                    new InvestmentSuggestion("learn-before-investing", "Explore general investment education",
                            "If your financial foundation is in place, learn how diversification, fees, liquidity, and risk work before making independent decisions."));
            case "NO_SURPLUS" -> List.of(new InvestmentSuggestion("cash-flow-review", "Review cash flow first",
                    "Your recorded income does not exceed recorded expenses this month. Consider reviewing your budget and near-term obligations before considering investments."));
            default -> List.of(new InvestmentSuggestion("record-finances", "Build a transaction history",
                    "Record income and expenses to see a reliable cash-flow summary. No investment suggestion is inferred from an empty month."));
        };
    }

    private static boolean isSafeExplanation(String answer) {
        return answer != null && !answer.isBlank() && answer.length() <= 600
                && answer.matches("(?s)[^0-9₹$€£%]*")
                && !answer.toLowerCase(java.util.Locale.ROOT).matches(
                        "(?s).*\\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|hundred|thousand|million|billion|half|twice|stocks?|shares?|equities|bonds?|funds?|etfs?|sip|crypto|cryptocurrency|returns?|yield|portfolio|allocation|guaranteed?|assured?|risk-free)\\b.*");
    }
}
