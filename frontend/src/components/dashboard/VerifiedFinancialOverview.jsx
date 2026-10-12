import { useEffect, useState } from "react";
import { BadgeCheck, RefreshCw } from "lucide-react";
import FinancialDashboardService from "../../services/financial-dashboard.service";
import Card from "../ui/Card";
import { formatInrAmount } from "../../utils/financialDisplay";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const amount = (value) => formatInrAmount(value);

export default function VerifiedFinancialOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await FinancialDashboardService.getLatestAvailableMonth();
      setDashboard(response.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-emerald-500/10" />
          <div className="space-y-2"><div className="h-4 w-48 animate-pulse rounded bg-[var(--bg-surface)]" /><div className="h-3 w-64 max-w-full animate-pulse rounded bg-[var(--bg-surface)]" /></div>
          <span className="sr-only">Loading verified financial summary...</span>
        </div>
      </Card>
    );
  }

  if (error || !dashboard) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-4">
          <p role="alert" className="text-sm text-rose-600">Unable to load verified financial data.</p>
          <button onClick={loadDashboard} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </Card>
    );
  }

  if (!dashboard.hasTransactionData || !dashboard.latestAvailableMonth) {
    return (
      <section aria-labelledby="verified-financial-title" className="space-y-5">
        <div className="flex items-center gap-2">
          <BadgeCheck size={19} className="text-emerald-600" />
          <h2 id="verified-financial-title" className="text-xl font-bold text-[var(--text-main)]">Verified Financial Insights</h2>
        </div>
        <Card>
          <p className="text-sm text-[var(--text-muted)]">No transaction data available yet.</p>
        </Card>
      </section>
    );
  }

  const summary = dashboard.currentMonthSummary;
  const comparison = dashboard.monthlyExpenseComparison;
  const categories = dashboard.categorySpending ?? [];
  const latestMonth = dashboard.latestAvailableMonth;
  const previousMonth = dashboard.previousAvailableMonth;
  const change = comparison.percentageDifference;
  const topCategory = categories[0];
  const chartData = categories.map(({ category, total }) => ({ category, total: Number(total) }));
  const statItems = [
    { title: "Total Income", value: summary.totalIncome },
    { title: "Total Expenses", value: summary.totalExpense },
    { title: "Net Balance", value: summary.netBalance },
  ];

  return (
    <section aria-labelledby="verified-financial-title" className="space-y-5">
      <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 via-[var(--bg-card)] to-[var(--bg-card)] p-5 sm:p-7 shadow-premium dark:border-emerald-900/50 dark:from-emerald-950/20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BadgeCheck size={19} className="text-emerald-600" />
            <h2 id="verified-financial-title" className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-main)]">Verified Financial Insights</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{latestMonth.label} · Calculated from your transaction data by the deterministic financial engine.</p>
        </div>
        <button onClick={loadDashboard} className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-primary-600 hover:border-primary-300">Refresh</button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statItems.map(({ title, value }) => (
          <div key={title} className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-card)]/90 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-main)]">{amount(value)}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Verified for {latestMonth.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="min-w-0">
          <h3 className="font-semibold text-[var(--text-main)]">Category spending</h3>
          {chartData.length === 0 ? (
            <p className="py-10 text-sm text-[var(--text-muted)]">No expense data available for {latestMonth.label}.</p>
          ) : (
            <div className="mt-4 h-64" aria-label="Category spending chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={amount} />
                  <YAxis type="category" dataKey="category" width={90} />
                  <Tooltip formatter={(value) => amount(value)} />
                  <Bar dataKey="total" name="Expense" fill="#0f766e" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <h3 className="font-semibold text-[var(--text-main)]">Monthly expense comparison</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{previousMonth.label} to {latestMonth.label}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--bg-surface)] p-4">
              <p className="text-xs text-[var(--text-muted)]">{previousMonth.label}</p>
              <p className="mt-1 text-lg font-bold">{amount(comparison.period1Total)}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-surface)] p-4">
              <p className="text-xs text-[var(--text-muted)]">{latestMonth.label}</p>
              <p className="mt-1 text-lg font-bold">{amount(comparison.period2Total)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Change: {amount(comparison.absoluteDifference)}{change == null ? " (percentage unavailable: previous month is zero)" : ` (${amount(change)}%)`}
          </p>
          <div className="mt-5 border-t border-[var(--border-base)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Verified fact</p>
            {topCategory ? (
              <p className="mt-2 text-sm text-[var(--text-main)]">
                {topCategory.category} is the largest tracked expense category at {amount(topCategory.total)} ({amount(topCategory.percentageOfTotalExpense)}% of expenses).
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">No category expense facts are available for this month.</p>
            )}
          </div>
        </Card>
      </div>
      <p className="text-xs text-[var(--text-muted)]">Financial values come from backend calculations and are displayed in INR.</p>
      </div>
    </section>
  );
}
