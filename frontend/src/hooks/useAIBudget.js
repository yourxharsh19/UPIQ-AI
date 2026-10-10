import { useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';

export const useAIBudget = () => {
  const { budgets, kpi, transactions, fraudAlerts, investments } = useFinancial();

  const metrics = useMemo(() => {
    const totalBudgeted = budgets.reduce((acc, b) => acc + b.budget, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
    const totalPredicted = budgets.reduce((acc, b) => acc + b.predicted, 0);
    
    const overBudgetCount = budgets.filter(b => b.spent > b.budget).length;
    const warningCount = budgets.filter(b => b.warning).length;

    const idleCash = Math.max(0, kpi.totalBalance - totalBudgeted);

    const anomaliesCount = transactions.filter(t => t.isAnomaly).length;
    const highRiskFraudCount = fraudAlerts.filter(f => f.riskScore >= 85).length;

    return {
      totalBudgeted,
      totalSpent,
      totalPredicted,
      overBudgetCount,
      warningCount,
      idleCash,
      anomaliesCount,
      highRiskFraudCount,
      budgets,
      investments,
    };
  }, [budgets, kpi, transactions, fraudAlerts, investments]);

  return metrics;
};
