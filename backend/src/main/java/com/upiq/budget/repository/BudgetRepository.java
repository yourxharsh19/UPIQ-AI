package com.upiq.budget.repository;

import com.upiq.budget.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUser_IdAndPeriodStartOrderByCategoryAsc(Long userId, LocalDate periodStart);

    Optional<Budget> findByIdAndUser_Id(Long id, Long userId);

    @Query("select b from Budget b where b.user.id = :userId and b.periodStart = :periodStart "
            + "and ((:category is null and b.category is null) or lower(b.category) = lower(:category))")
    Optional<Budget> findForUserAndPeriodAndCategory(@Param("userId") Long userId,
            @Param("periodStart") LocalDate periodStart, @Param("category") String category);
}
