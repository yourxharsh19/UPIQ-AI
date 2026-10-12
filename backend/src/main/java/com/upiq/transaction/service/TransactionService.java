package com.upiq.transaction.service;

import com.upiq.transaction.dto.TransactionResponse;

import java.util.List;

public interface TransactionService {

    TransactionResponse addTransaction(com.upiq.transaction.dto.CreateTransactionRequest request, Long userId);

    boolean addImportedTransaction(com.upiq.transaction.dto.CreateTransactionRequest request, Long userId, String importIdentity);

    List<TransactionResponse> getUserTransactions(Long userId);

    List<TransactionResponse> getUserTransactionsByCategory(Long userId, String category);

    void deleteTransaction(Long id, Long userId);

    TransactionResponse getById(Long id, Long userId);

    TransactionResponse updateTransaction(Long id, com.upiq.transaction.dto.CreateTransactionRequest request,
            Long userId);

    void deleteAllTransactions(Long userId);
}
