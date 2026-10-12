package com.upiq.transaction.service.impl;

import com.upiq.category.service.CategoryService;
import com.upiq.transaction.categorization.CategorizationConfidence;
import com.upiq.transaction.categorization.SmartCategorizationResult;
import com.upiq.transaction.categorization.SmartCategorizationService;
import com.upiq.transaction.dto.CreateTransactionRequest;
import com.upiq.transaction.dto.TransactionResponse;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.security.access.AccessDeniedException;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceImplCategorizationTest {

    @Mock
    private TransactionRepository repository;

    @Mock
    private SmartCategorizationService categorizationService;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    @Test
    void preservesExplicitManualCategoryOnCreate() {
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction saved = invocation.getArgument(0);
            saved.setId(17L);
            return saved;
        });

        TransactionResponse response = transactionService.addTransaction(request("Food", "Paid to local cafe"), 5L);

        assertEquals("Food", response.getCategory());
        assertEquals(17L, response.getId());
        assertEquals(5L, response.getUserId());
        ArgumentCaptor<Transaction> savedCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(repository).save(savedCaptor.capture());
        assertEquals(5L, savedCaptor.getValue().getUserId());
        assertNull(savedCaptor.getValue().getImportIdentity());
        verify(categorizationService, never()).categorize(any(), any(), any());
        verify(categoryService, never()).ensureCategoryExists(any(), any(), any());
    }

    @Test
    void acceptsDateOnlyOnCreateAsStartOfDay() {
        CreateTransactionRequest datedRequest = request("Food", "Cafe");
        datedRequest.setDate("2026-10-13");
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.addTransaction(datedRequest, 5L);

        assertEquals(LocalDateTime.parse("2026-10-13T00:00:00"), response.getDate());
    }

    @Test
    void storesAllowedMixedCaseTransactionTypeInCanonicalLowercase() {
        CreateTransactionRequest mixedCaseRequest = request("Food", "Cafe");
        mixedCaseRequest.setType("EXPENSE");
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.addTransaction(mixedCaseRequest, 5L);

        assertEquals("expense", response.getType());
    }

    @Test
    void rejectsInvalidCreateDateInsteadOfReplacingItWithCurrentTime() {
        CreateTransactionRequest datedRequest = request("Food", "Cafe");
        datedRequest.setDate("not-a-date");

        assertThrows(IllegalArgumentException.class, () -> transactionService.addTransaction(datedRequest, 5L));
        verify(repository, never()).save(any(Transaction.class));
    }

    @Test
    void acceptsDateOnlyOnUpdateAsStartOfDay() {
        Transaction existing = transactionOwnedBy(5L);
        CreateTransactionRequest datedRequest = request("Food", "Cafe");
        datedRequest.setDate("2026-10-13");
        when(repository.findById(20L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.updateTransaction(20L, datedRequest, 5L);

        assertEquals(LocalDateTime.parse("2026-10-13T00:00:00"), response.getDate());
    }

    @Test
    void doesNotWriteTransactionAmountsOrCategoriesToApplicationLogs() {
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Logger logger = (Logger) LoggerFactory.getLogger(TransactionServiceImpl.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            transactionService.addTransaction(
                    new CreateTransactionRequest(9876.54, "expense", "PrivateCategory", "Sensitive merchant", "UPI", null),
                    51L);

            String loggedMessages = appender.list.stream()
                    .map(ILoggingEvent::getFormattedMessage)
                    .reduce("", (left, right) -> left + " " + right);
            assertFalse(loggedMessages.contains("9876.54"));
            assertFalse(loggedMessages.contains("PrivateCategory"));
            assertFalse(loggedMessages.contains("Sensitive merchant"));
            assertFalse(loggedMessages.contains("51"));
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void automaticallyCategorizesOnlyFallbackCategoryOnCreate() {
        when(categorizationService.categorize("Paid to Spotify India", null, "expense"))
                .thenReturn(new SmartCategorizationResult("Entertainment", CategorizationConfidence.HIGH, List.of("SPOTIFY")));
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.addTransaction(
                request("Uncategorized", "Paid to Spotify India"), 5L);

        assertEquals("Entertainment", response.getCategory());
        verify(categoryService).ensureCategoryExists("Entertainment", "expense", 5L);
    }

    @Test
    void importedInsertUsesUserScopedIdentityAndReportsConflictAsDuplicate() {
        when(repository.insertImportedIfAbsent(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(0, 1);
        CreateTransactionRequest request = request("Food", "Paid to local cafe");
        String identity = "a".repeat(64) + ":2";

        assertEquals(false, transactionService.addImportedTransaction(request, 5L, identity));
        assertEquals(true, transactionService.addImportedTransaction(request, 5L, identity));
        verify(repository, org.mockito.Mockito.times(2)).insertImportedIfAbsent(
                org.mockito.ArgumentMatchers.eq(5L), org.mockito.ArgumentMatchers.eq(100d),
                org.mockito.ArgumentMatchers.eq("expense"), org.mockito.ArgumentMatchers.eq("Food"),
                org.mockito.ArgumentMatchers.eq("Paid to local cafe"), any(),
                org.mockito.ArgumentMatchers.eq("UPI"), org.mockito.ArgumentMatchers.eq(identity));
    }

    @Test
    void deleteAllDelegatesOnlyTheAuthenticatedUsersIdToRepository() {
        transactionService.deleteAllTransactions(42L);
        verify(repository).deleteByUserId(42L);
    }

    @Test
    void preservesExplicitManualCategoryOnUpdate() {
        Transaction existing = Transaction.builder().id(20L).userId(5L).amount(90d)
                .type("expense").category("Uncategorized").description("Old description").build();
        when(repository.findById(20L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.updateTransaction(
                20L, request("Shopping", "Paid to Amazon"), 5L);

        assertEquals("Shopping", response.getCategory());
        verify(categorizationService, never()).categorize(any(), any(), any());
        verify(categoryService, never()).ensureCategoryExists(any(), any(), any());
        ArgumentCaptor<Transaction> savedCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(repository).save(savedCaptor.capture());
        assertEquals("Shopping", savedCaptor.getValue().getCategory());
    }

    @Test
    void rejectsReadingAnotherUsersTransaction() {
        when(repository.findById(20L)).thenReturn(Optional.of(transactionOwnedBy(6L)));

        assertThrows(AccessDeniedException.class, () -> transactionService.getById(20L, 5L));
    }

    @Test
    void rejectsUpdatingOrDeletingAnotherUsersTransaction() {
        when(repository.findById(20L)).thenReturn(Optional.of(transactionOwnedBy(6L)));

        assertThrows(AccessDeniedException.class,
                () -> transactionService.updateTransaction(20L, request("Shopping", "Item"), 5L));
        assertThrows(AccessDeniedException.class, () -> transactionService.deleteTransaction(20L, 5L));
        verify(repository, never()).save(any(Transaction.class));
        verify(repository, never()).delete(any(Transaction.class));
    }

    private Transaction transactionOwnedBy(Long userId) {
        return Transaction.builder().id(20L).userId(userId).amount(90d)
                .type("expense").category("Food").description("Private transaction").build();
    }

    private CreateTransactionRequest request(String category, String description) {
        return new CreateTransactionRequest(100d, "expense", category, description, "UPI", null);
    }
}
