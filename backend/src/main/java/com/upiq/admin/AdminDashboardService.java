package com.upiq.admin;

import com.upiq.auth.repository.UserRepository;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private final UserRepository users;
    private final TransactionRepository transactions;

    public AdminDashboardResponse getSummary() {
        Object[] totals = transactions.getPlatformTotals().stream().findFirst()
                .orElse(new Object[]{0L, null, null});
        return AdminDashboardResponse.builder().userCount(users.count())
                .activeUserCount(users.countByActiveTrue())
                .transactionCount(totals[0] == null ? 0L : ((Number) totals[0]).longValue())
                .recordedIncome(decimal(totals[1])).recordedExpenses(decimal(totals[2])).build();
    }

    private static BigDecimal decimal(Object value) { return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString()); }
}
