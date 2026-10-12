package com.upiq.financial.chat;

import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialContextBuilder;
import com.upiq.research.intent.DispatchedCalculation;
import com.upiq.research.intent.FinancialIntentDispatcher;
import com.upiq.research.llm.SystemCResponse;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialChatService {

    static final String UNSUPPORTED_ANSWER = "I can currently answer questions about your income, expenses, "
            + "category spending, period comparisons, spending trends, net balance, and largest transactions.";
    static final String AI_UNAVAILABLE_ANSWER = "Your verified calculation is ready, but the AI service is "
            + "currently unavailable. Please try again shortly.";
    static final String AI_EDUCATION_UNAVAILABLE_ANSWER = "The AI service is currently unavailable. "
            + "Please try again shortly.";

    private final TransactionRepository transactionRepository;
    private final FinancialChatIntentResolver intentResolver;
    private final FinancialIntentDispatcher intentDispatcher;
    private final FinancialContextBuilder contextBuilder;
    private final SystemCService systemCService;

    public FinancialChatResponse answer(String question, Long authenticatedUserId) {
        if (authenticatedUserId == null || question == null || question.isBlank()) {
            return unsupported();
        }

        if (intentResolver.isGeneralEducationalQuestion(question)) {
            try {
                SystemCResponse generated = systemCService.answerGeneral(question);
                return FinancialChatResponse.builder().answer(generated.getAnswer())
                        .model(generated.getModel()).latencyMs(generated.getLatencyMs())
                        .supported(true).error(false).build();
            } catch (RuntimeException exception) {
                log.warn("Financial chat education response failed exceptionClass={}",
                        safeExceptionClass(exception));
                return FinancialChatResponse.builder().answer(AI_EDUCATION_UNAVAILABLE_ANSWER)
                        .supported(true).error(true).build();
            }
        }

        Optional<Transaction> latest = transactionRepository.findTopByUserIdOrderByDateDesc(authenticatedUserId);
        if (latest.isEmpty()) {
            return FinancialChatResponse.builder()
                    .answer("No transaction data is available yet. Add transactions to ask a financial question.")
                    .supported(true)
                    .error(false)
                    .build();
        }
        YearMonth latestMonth = YearMonth.from(latest.get().getDate());
        Optional<Transaction> earliest = transactionRepository.findTopByUserIdOrderByDateAsc(authenticatedUserId);
        var benchmarkQuestion = intentResolver.resolve(question, latestMonth,
                earliest.map(Transaction::getDate).map(LocalDateTime::toLocalDate).orElse(null));
        if (benchmarkQuestion.isEmpty()) return unsupported();

        LocalDate periodStart = LocalDate.parse(benchmarkQuestion.get().getStartDate());
        LocalDate periodEnd = LocalDate.parse(benchmarkQuestion.get().getEndDate());
        boolean hasPeriodTransactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
                        authenticatedUserId, periodStart.atStartOfDay(), periodEnd.plusDays(1).atStartOfDay().minusNanos(1))
                .stream().anyMatch(transaction -> "income".equalsIgnoreCase(transaction.getType())
                        || "expense".equalsIgnoreCase(transaction.getType()));
        if (!hasPeriodTransactions) {
            YearMonth requestedMonth = YearMonth.from(periodStart);
            String latestLabel = latestMonth.getMonth().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
                    + " " + latestMonth.getYear();
            String requestedLabel = requestedMonth.getMonth().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
                    + " " + requestedMonth.getYear();
            return FinancialChatResponse.builder()
                    .answer("No income or expense transactions are available for " + requestedLabel
                            + ". Your latest available transaction month is " + latestLabel
                            + ". You can ask me to analyze that month instead.")
                    .calculationType(benchmarkQuestion.get().getCalculationType())
                    .supported(true).error(false).build();
        }

        DispatchedCalculation calculation;
        FinancialContext context;
        try {
            calculation = intentDispatcher.dispatch(benchmarkQuestion.get(), authenticatedUserId);
            context = contextBuilder.build(calculation);
        } catch (RuntimeException exception) {
            return FinancialChatResponse.builder()
                    .answer("I couldn't complete the verified calculation right now. Please try again shortly.")
                    .calculationType(benchmarkQuestion.get().getCalculationType())
                    .supported(true)
                    .error(true)
                    .build();
        }

        try {
            SystemCResponse generated = systemCService.answer(question, context);
            return FinancialChatResponse.builder()
                    .answer(generated.getAnswer())
                    .calculationType(calculation.getIntent().getCalculationType().name())
                    .financialContext(context)
                    .model(generated.getModel())
                    .latencyMs(generated.getLatencyMs())
                    .supported(true)
                    .error(false)
                    .build();
        } catch (RuntimeException exception) {
            log.warn("Financial chat grounded explanation failed exceptionClass={}",
                    safeExceptionClass(exception));
            return FinancialChatResponse.builder()
                    .answer(AI_UNAVAILABLE_ANSWER)
                    .calculationType(calculation.getIntent().getCalculationType().name())
                    .financialContext(context)
                    .supported(true)
                    .error(true)
                    .build();
        }
    }

    private static FinancialChatResponse unsupported() {
        return FinancialChatResponse.builder()
                .answer(UNSUPPORTED_ANSWER)
                .supported(false)
                .error(false)
                .build();
    }

    private static String safeExceptionClass(RuntimeException exception) {
        String className = exception.getClass().getSimpleName();
        return className.length() <= 80 ? className : className.substring(0, 80);
    }
}
