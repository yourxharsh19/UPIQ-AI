import React from 'react';
import { Activity, ArrowUpRight, Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { StatCard } from '../components/dashboard/StatCard';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { RecentTransactionsWidget } from '../components/dashboard/RecentTransactionsWidget';
import { QuickAskBar } from '../components/dashboard/QuickAskBar';
import { UpcomingFeaturesSection } from '../components/dashboard/UpcomingFeaturesSection';
import { formatSavingsRate } from '../utils/financialDisplay';

export const Dashboard = () => {
  const { kpi, profile, transactions, setActiveTab } = useFinancial();

  const overviewMonth = transactions?.length > 0 && transactions[0]?.date
    ? new Date(transactions[0].date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <section className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Financial Overview · {overviewMonth}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
              Welcome back, {profile.name.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
              Here is a summary of your ledger cash flow, category budgets, and recent transactions.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 self-start sm:self-auto rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3.5 py-2 hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Account
              </p>
              <p className="text-xs font-semibold text-[var(--text-main)]">
                {profile.accountType}
              </p>
            </div>
            <ArrowUpRight className="ml-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          </div>
        </div>
      </section>

      {/* KPI Stat Cards Summary Grid */}
      <section
        aria-label="Financial summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatCard title="Monthly Net Balance" value={kpi.totalBalance} change={kpi.balanceChange} isPositive icon={Wallet} color="indigo" featured className="sm:col-span-2" />
        <StatCard title="Monthly Income" value={kpi.monthlyIncome} change={kpi.incomeChange} isPositive icon={TrendingUp} color="emerald" />
        <StatCard title="Monthly Expenses" value={kpi.monthlyExpense} change={kpi.expenseChange} isPositive icon={TrendingDown} color="rose" />
        <StatCard title="Savings Rate" value={formatSavingsRate(kpi.savingsRate)} change={kpi.savingsChange} isPositive icon={PiggyBank} color="purple" />
      </section>

      {/* Quick financial query prompt */}
      <div>
        <QuickAskBar />
      </div>

      {/* Financial Analytics Grid */}
      <section
        aria-label="Financial analytics"
        className="grid grid-cols-1 gap-5 xl:grid-cols-12"
      >
        <div className="xl:col-span-8"><IncomeExpenseChart /></div>
        <div className="xl:col-span-4"><CategoryDonutChart /></div>
      </section>

      {/* Recent Ledger Stream Widget */}
      <div>
        <RecentTransactionsWidget />
      </div>

      {/* Backend Feature Roadmap */}
      <div>
        <UpcomingFeaturesSection />
      </div>
    </div>
  );
};
