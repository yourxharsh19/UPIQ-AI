package com.upiq.transaction.service.impl;

import com.upiq.category.service.CategoryService;
import com.upiq.transaction.dto.CreateTransactionRequest;
import com.upiq.transaction.dto.TransactionResponse;
import com.upiq.transaction.categorization.CategorizationConfidence;
import com.upiq.transaction.categorization.SmartCategorizationResult;
import com.upiq.transaction.categorization.SmartCategorizationService;
import com.upiq.transaction.exceptions.TransactionNotFoundException;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import com.upiq.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@org.springframework.transaction.annotation.Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository repository;
    private final SmartCategorizationService categorizationService;
    private final CategoryService categoryService;

    @Override
    public TransactionResponse addTransaction(CreateTransactionRequest request, Long userId) {
        Transaction transaction = Transaction.builder()
                .amount(request.getAmount())
                .category(resolveCategory(request, userId))
                .description(request.getDescription())
                .type(normalizedType(request))
                .paymentMethod(request.getPaymentMethod())
                .userId(userId)
                .build();

        if (request.getDate() != null && !request.getDate().isEmpty()) {
            transaction.setDate(parseTransactionDate(request.getDate()));
        } else {
            transaction.setDate(LocalDateTime.now());
        }
        log.info("Adding new {} transaction", request.getType());
        transaction = repository.save(transaction);
        log.debug("Transaction created successfully");
        return mapToResponse(transaction);
    }

    @Override
    public boolean addImportedTransaction(CreateTransactionRequest request, Long userId, String importIdentity) {
        LocalDateTime date = LocalDateTime.now();
        if (request.getDate() != null && !request.getDate().isBlank()) {
            String dateStr = request.getDate().replace("Z", "");
            if (!dateStr.contains("T") && dateStr.contains(" ")) dateStr = dateStr.replace(" ", "T");
            date = LocalDateTime.parse(dateStr);
        }
        String category = resolveCategory(request, userId);
        return repository.insertImportedIfAbsent(userId, request.getAmount(), request.getType(), category,
                request.getDescription(), date, request.getPaymentMethod(), importIdentity) == 1;
    }

    @Override
    public List<TransactionResponse> getUserTransactions(Long userId) {
        List<Transaction> transactions = repository.findByUserIdOrderByDateDesc(userId);
        return transactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getUserTransactionsByCategory(Long userId, String category) {
        List<Transaction> transactions = repository.findByUserIdAndCategoryIgnoreCase(userId, category);
        return transactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteTransaction(Long id, Long userId) {
        Transaction transaction = repository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));

        // Security check: Ensure user owns the transaction
        if (!transaction.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not own this transaction");
        }
        log.info("Deleting transaction");
        repository.delete(transaction);
        log.debug("Transaction deleted successfully");
    }

    @Override
    public TransactionResponse getById(Long id, Long userId) {
        Transaction transaction = repository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));

        // Security check: Ensure user owns the transaction
        if (!transaction.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not own this transaction");
        }
        return mapToResponse(transaction);
    }

    @Override
    public TransactionResponse updateTransaction(Long id, CreateTransactionRequest request, Long userId) {
        Transaction transaction = repository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));

        // Security check: Ensure user owns transaction or is admin (assuming user check
        // is enough for now)
        if (!transaction.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not own this transaction");
        }

        transaction.setAmount(request.getAmount());
        transaction.setCategory(resolveCategory(request, userId));
        transaction.setDescription(request.getDescription());
        transaction.setType(normalizedType(request));
        transaction.setPaymentMethod(request.getPaymentMethod());

        if (request.getDate() != null && !request.getDate().isEmpty()) {
            transaction.setDate(parseTransactionDate(request.getDate()));
        }

        log.info("Updating transaction");
        Transaction updated = repository.save(transaction);
        log.debug("Transaction updated successfully");
        return mapToResponse(updated);
    }

    // ... end of updateTransaction method ...

    @Override
    public void deleteAllTransactions(Long userId) {
        repository.deleteByUserId(userId);
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .userId(transaction.getUserId())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .category(transaction.getCategory())
                .description(transaction.getDescription())
                .date(transaction.getDate())
                .paymentMethod(transaction.getPaymentMethod())
                .build();
    }

    private String resolveCategory(CreateTransactionRequest request, Long userId) {
        String requestedCategory = request.getCategory();
        if (requestedCategory == null || requestedCategory.isBlank()
                || "Uncategorized".equalsIgnoreCase(requestedCategory.trim())) {
            SmartCategorizationResult result = categorizationService.categorize(
                    request.getDescription(), null, normalizedType(request));
            if (result.confidence() != CategorizationConfidence.LOW
                    && !"Uncategorized".equalsIgnoreCase(result.category())) {
                categoryService.ensureCategoryExists(result.category(), normalizedType(request), userId);
            }
            return result.category();
        }
        return requestedCategory;
    }

    private String normalizedType(CreateTransactionRequest request) {
        return request.getType().toLowerCase(Locale.ROOT);
    }

    private LocalDateTime parseTransactionDate(String value) {
        String dateText = value.trim();
        if (dateText.endsWith("Z")) dateText = dateText.substring(0, dateText.length() - 1);
        if (!dateText.contains("T") && dateText.contains(" ")) dateText = dateText.replace(" ", "T");

        try {
            return LocalDateTime.parse(dateText);
        } catch (DateTimeParseException dateTimeFailure) {
            try {
                return LocalDate.parse(dateText).atStartOfDay();
            } catch (DateTimeParseException dateFailure) {
                throw new IllegalArgumentException("Transaction date must be an ISO date or date-time", dateFailure);
            }
        }
    }
}
