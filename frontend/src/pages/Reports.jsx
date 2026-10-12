import { useEffect, useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FinancialDashboardService } from '../services/financial-dashboard.service';
import { createMonthlyReportCsv, formatMonthLabel, getAvailableReportMonths, getMonthlyReport } from '../utils/monthlyReport.js';
import { getTransactionCoverage, hasTransactionsInMonth } from '../utils/transactionCoverage.js';

const monthDate = (value) => {
  const dateText = String(value || '');
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]} ${formatMonthLabel(dateText.slice(0, 7))}` : dateText || 'Date unavailable';
};

export const Reports = () => {
  const { transactions, transactionsError, refreshTransactions, loading, formatCurrency } = useFinancial();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [downloadState, setDownloadState] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const months = useMemo(() => getAvailableReportMonths(transactions), [transactions]);
  const coverage = useMemo(() => getTransactionCoverage(transactions), [transactions]);
  const selectedMonthHasTransactions = hasTransactionsInMonth(transactions, selectedMonth);
  useEffect(() => {
    if (!selectedMonth && coverage.defaultMonth) setSelectedMonth(coverage.defaultMonth);
  }, [coverage.defaultMonth, selectedMonth]);
  const report = useMemo(() => getMonthlyReport(transactions, selectedMonth), [transactions, selectedMonth]);
  const previousMonth = useMemo(() => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-').map(Number);
    const previousDate = new Date(year, month - 2, 1);
    return `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);
  const previousReport = useMemo(() => getMonthlyReport(transactions, previousMonth), [transactions, previousMonth]);
  const hasPreviousComparison = previousReport.transactionCount > 0;

  const downloadCsv = () => {
    setDownloadError('');
    setDownloadState('csv');
    try {
      const blob = new Blob([createMonthlyReportCsv(report)], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `UPIQ-Monthly-Report-${selectedMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError('CSV report could not be created. Please try again.');
    } finally {
      setDownloadState('');
    }
  };

  const downloadPdf = async () => {
    setDownloadError('');
    setDownloadState('pdf');
    try {
      await FinancialDashboardService.downloadPdfReport(selectedMonth);
    } catch {
      setDownloadError('PDF report could not be downloaded. Check your connection and try again.');
    } finally {
      setDownloadState('');
    }
  };

  const changeText = (current, previous) => {
    if (previous === 0) return 'Percentage change unavailable (previous month was zero)';
    const change = ((current - previous) / previous) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged';
    return `${Math.abs(change).toFixed(1)}% ${direction} from ${formatMonthLabel(previousMonth)}`;
  };

  if (loading && transactions.length === 0) {
    return <div className="p-6 text-sm text-[var(--text-muted)]" role="status">Loading transactions for your report…</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)]">Monthly Report</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Income, expenses, categories, and transactions from your account ledger.</p>
            {coverage.earliestDate && <p className="mt-1 text-xs text-[var(--text-muted)]">Available/imported transaction dates: {coverage.earliestDate} to {coverage.latestDate}. This describes the loaded ledger, not proof of complete banking coverage.</p>}
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <CalendarDays size={17} aria-hidden="true" />
          <span>Reporting month</span>
          <select
            aria-label="Reporting month"
            value={selectedMonth}
            disabled={!months.length}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-main)]"
          >
            {!months.length && <option value="">No transaction data</option>}
            {months.map((month) => <option key={month} value={month}>{formatMonthLabel(month)}</option>)}
          </select>
        </label>
      </header>

      {transactionsError && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-sm text-rose-300">
        <p>{transactionsError}</p>
        <button type="button" onClick={refreshTransactions} className="mt-2 underline underline-offset-2">Retry loading transactions</button>
      </div>}

      <Card className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">{selectedMonth ? formatMonthLabel(selectedMonth) : 'No transaction data'}</h2>
            <p className="text-xs text-[var(--text-muted)]">Figures are based on income and expense transactions for this month. Values are displayed as INR.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadCsv} disabled={!!downloadState || !selectedMonth} variant="secondary" icon={FileSpreadsheet}>
              {downloadState === 'csv' ? 'Preparing CSV…' : 'Download CSV'}
            </Button>
            <Button onClick={downloadPdf} disabled={!!downloadState || !selectedMonth} variant="ai" icon={FileDown}>
              {downloadState === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
            </Button>
          </div>
        </div>
        {downloadError && <p role="alert" className="text-sm text-rose-400">{downloadError}</p>}
        {selectedMonth && !selectedMonthHasTransactions && coverage.latestDate && <p className="text-sm text-amber-700 dark:text-amber-300" role="status">No income or expense transactions are available for this selected month. Earlier or later ledger data has not been substituted.</p>}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ['Total income', report.totalIncome],
            ['Total expenses', report.totalExpense],
            ['Net cash flow', report.netCashFlow],
            ['Transactions', report.transactionCount],
            ['Average expense', report.averageExpense],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4">
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-main)]">
                {label === 'Transactions' ? value : formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>

        <section aria-labelledby="report-comparison-heading" className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-base)] p-4">
            <h3 id="report-comparison-heading" className="text-sm font-semibold text-[var(--text-main)]">Income vs expenses</h3>
            <div className="mt-3 space-y-2 text-xs">
              <p>Income <span className="float-right">{formatCurrency(report.totalIncome)}</span></p>
              <div className="h-2 overflow-hidden rounded bg-slate-700"><div className="h-full bg-emerald-500" style={{ width: `${report.totalIncome + report.totalExpense ? (report.totalIncome / (report.totalIncome + report.totalExpense)) * 100 : 0}%` }} /></div>
              <p>Expenses <span className="float-right">{formatCurrency(report.totalExpense)}</span></p>
              <div className="h-2 overflow-hidden rounded bg-slate-700"><div className="h-full bg-rose-500" style={{ width: `${report.totalIncome + report.totalExpense ? (report.totalExpense / (report.totalIncome + report.totalExpense)) * 100 : 0}%` }} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-base)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Month-over-month change</h3>
            {selectedMonth && hasPreviousComparison ? (
              <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                <p>Income: {changeText(report.totalIncome, previousReport.totalIncome)}</p>
                <p>Expenses: {changeText(report.totalExpense, previousReport.totalExpense)}</p>
              </div>
            ) : <p className="mt-3 text-sm text-[var(--text-muted)]">{selectedMonth ? 'No prior-month transactions are available for comparison.' : 'Import transactions to see monthly comparisons.'}</p>}
          </div>
        </section>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-[var(--text-main)]">Expense by category</h2>
          {report.categories.length ? <ul className="space-y-3">
            {report.categories.map((category) => <li key={category.category} className="text-sm">
              <div className="flex justify-between gap-3"><span>{category.category}</span><span>{formatCurrency(category.amount)} · {category.percentage.toFixed(1)}%</span></div>
              <div className="mt-1 h-1.5 rounded bg-slate-700"><div className="h-full rounded bg-indigo-500" style={{ width: `${Math.min(category.percentage, 100)}%` }} /></div>
            </li>)}
          </ul> : <p className="text-sm text-[var(--text-muted)]">No expense transactions are recorded for this month.</p>}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-[var(--text-main)]">Largest expenses</h2>
          {report.largestExpenses.length ? <ul className="space-y-3">
            {report.largestExpenses.map((transaction) => <li key={transaction.id} className="flex justify-between gap-3 border-b border-[var(--border-base)] pb-2 text-sm">
              <span><span className="block font-medium">{transaction.title || transaction.merchant || 'Transaction'}</span><span className="text-xs text-[var(--text-muted)]">{transaction.category || 'Uncategorized'} · {monthDate(transaction.date)}</span></span>
              <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
            </li>)}
          </ul> : <p className="text-sm text-[var(--text-muted)]">No expenses for this month.</p>}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-[var(--text-main)]">Recent transactions</h2>
        {report.recentTransactions.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b border-[var(--border-base)] text-xs text-[var(--text-muted)]"><th className="py-2">Date</th><th>Description</th><th>Category</th><th>Type</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{report.recentTransactions.map((transaction) => <tr key={transaction.id} className="border-b border-[var(--border-base)]"><td className="py-2">{monthDate(transaction.date)}</td><td>{transaction.title || transaction.merchant || 'Transaction'}</td><td>{transaction.category || 'Uncategorized'}</td><td className="capitalize">{transaction.type}</td><td className="text-right">{formatCurrency(transaction.amount)}</td></tr>)}</tbody>
        </table></div> : <p className="text-sm text-[var(--text-muted)]">{selectedMonth
          ? `No income or expense transactions were found for ${formatMonthLabel(selectedMonth)}.`
          : 'Import transactions to generate a report.'}</p>}
      </Card>
      <p className="text-xs text-[var(--text-muted)]">Budget comparisons are omitted because budget data is not connected to the authenticated report data source.</p>
    </div>
  );
};
