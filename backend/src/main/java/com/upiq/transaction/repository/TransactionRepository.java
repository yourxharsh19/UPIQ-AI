package com.upiq.transaction.repository;

import com.upiq.transaction.model.Transaction;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Modifying
    @Query(value = "INSERT INTO transactions (user_id, amount, type, category, description, date, payment_method, import_identity) "
            + "VALUES (:userId, :amount, :type, :category, :description, :date, :paymentMethod, :importIdentity) "
            + "ON CONFLICT (user_id, import_identity) DO NOTHING", nativeQuery = true)
    int insertImportedIfAbsent(@Param("userId") Long userId,
            @Param("amount") Double amount,
            @Param("type") String type,
            @Param("category") String category,
            @Param("description") String description,
            @Param("date") LocalDateTime date,
            @Param("paymentMethod") String paymentMethod,
            @Param("importIdentity") String importIdentity);

    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    Optional<Transaction> findTopByUserIdOrderByDateDesc(Long userId);

    Optional<Transaction> findTopByUserIdOrderByDateAsc(Long userId);

    @Query("select t from Transaction t where t.userId = :userId "
            + "and (t.category is null or trim(t.category) = '' or lower(t.category) = 'uncategorized')")
    List<Transaction> findUncategorizedByUserId(@Param("userId") Long userId);

    List<Transaction> findByUserIdAndCategoryIgnoreCase(Long userId, String category);

    void deleteByUserId(Long userId);

    // Date-range and filtered queries for deterministic financial calculations
    List<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDateTime startDate, LocalDateTime endDate);

    List<Transaction> findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(Long userId, String type, LocalDateTime startDate, LocalDateTime endDate);

    List<Transaction> findByUserIdAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(Long userId, String category, LocalDateTime startDate, LocalDateTime endDate);

    List<Transaction> findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(Long userId, String type, String category, LocalDateTime startDate, LocalDateTime endDate);

    List<Transaction> findByUserIdAndDateBetweenOrderByAmountDesc(Long userId, LocalDateTime startDate, LocalDateTime endDate);

    List<Transaction> findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByAmountDesc(Long userId, String type, LocalDateTime startDate, LocalDateTime endDate);
}
