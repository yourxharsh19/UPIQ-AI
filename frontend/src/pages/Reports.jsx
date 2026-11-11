import { useState, useEffect, useMemo } from 'react';
import { FileDown, FileSpreadsheet, CalendarDays, BookmarkPlus, Eye, Trash2, Info, Clock } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { PDFPreviewModal } from '../components/reports/PDFPreviewModal';
import { FinancialDashboardService } from '../services/financial-dashboard.service';
import { createMonthlyReportCsv, formatMonthLabel, getAvailableReportMonths, getMonthlyReport } from '../utils/monthlyReport.js';
import { getTransactionCoverage, hasTransactionsInMonth } from '../utils/transactionCoverage.js';

const monthDate = (value) => {
  const dateText = String(value || '');
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]} ${formatMonthLabel(dateText.slice(0, 7))}` : dateText || 'Date unavailable';
};

export const Reports = () => {
  const { transactions, transactionsError, refreshTransactions, loading, formatCurrency, reportHistory, saveReportPreview, deleteReportPreview, openStatementModal } = useFinancial();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [downloadState, setDownloadState] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [previewModalReport, setPreviewModalReport] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const rawMonths = useMemo(() => getAvailableReportMonths(transactions), [transactions]);
  const months = useMemo(() => (rawMonths.length ? rawMonths : [currentMonthKey]), [rawMonths, currentMonthKey]);
  const coverage = useMemo(() => getTransactionCoverage(transactions), [transactions]);

  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(coverage.defaultMonth || months[0] || currentMonthKey);
    }
  }, [coverage.defaultMonth, selectedMonth, months, currentMonthKey]);

  const activeMonth = selectedMonth || coverage.defaultMonth || months[0] || currentMonthKey;
  const selectedMonthHasTransactions = hasTransactionsInMonth(transactions, activeMonth);
  const report = useMemo(() => getMonthlyReport(transactions, activeMonth), [transactions, activeMonth]);

  const previousMonth = useMemo(() => {
    if (!activeMonth) return '';
    const [year, month] = activeMonth.split('-').map(Number);
    const previousDate = new Date(year, month - 2, 1);
    return `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  }, [activeMonth]);
  const previousReport = useMemo(() => getMonthlyReport(transactions, previousMonth), [transactions, previousMonth]);
  const hasPreviousComparison = previousReport.transactionCount > 0;

  const downloadCsv = () => {
    setDownloadError('');
    setDownloadState('csv');
    try {
      const activeReport = report || getMonthlyReport(transactions, activeMonth);
      const blob = new Blob([createMonthlyReportCsv(activeReport)], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `UPIQ-Monthly-Report-${activeMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      saveReportPreview(activeReport);
    } catch {
      setDownloadError('CSV report could not be created. Please try again.');
    } finally {
      setDownloadState('');
    }
  };

  const downloadPdf = async () => {
    setDownloadError('');
    setDownloadState('pdf');
    const activeReport = report || getMonthlyReport(transactions, activeMonth);
    try {
      await FinancialDashboardService.downloadPdfReport(activeMonth);
      saveReportPreview(activeReport);
    } catch {
      // If backend PDF service is offline or unauthenticated (e.g. demo mode),
      // seamlessly open the preview modal where the user can click "Print / Save as PDF"
      setPreviewModalReport(activeReport);
      setIsPreviewModalOpen(true);
      setDownloadError('');
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={openStatementModal}
            variant="secondary"
            icon={FileSpreadsheet}
          >
            Import Statement
          </Button>
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <CalendarDays size={17} aria-hidden="true" />
            <span>Reporting month</span>
            <select
              aria-label="Reporting month"
              value={activeMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-main)] cursor-pointer"
            >
              {months.map((month) => <option key={month} value={month}>{formatMonthLabel(month)}</option>)}
            </select>
          </label>
        </div>
      </header>

      {transactions.length === 0 && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-main)]">No Statement Uploaded Yet</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Upload a bank statement (PDF or CSV) to populate your monthly income, expenses, and category reports.</p>
            </div>
          </div>
          <Button onClick={openStatementModal} variant="primary" size="sm" icon={FileSpreadsheet} className="shrink-0">
            Upload Statement
          </Button>
        </div>
      )}

      {transactionsError && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-sm text-rose-300">
        <p>{transactionsError}</p>
        <button type="button" onClick={refreshTransactions} className="mt-2 underline underline-offset-2">Retry loading transactions</button>
      </div>}

      <Card className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">{activeMonth ? formatMonthLabel(activeMonth) : 'Current Month'}</h2>
            <p className="text-xs text-[var(--text-muted)]">Figures are based on income and expense transactions for this month. Values are displayed as INR.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setPreviewModalReport(report || getMonthlyReport(transactions, activeMonth));
                setIsPreviewModalOpen(true);
              }}
              disabled={!activeMonth}
              variant="secondary"
              icon={Eye}
            >
              Preview
            </Button>
            <Button
              onClick={() => saveReportPreview(report || getMonthlyReport(transactions, activeMonth))}
              disabled={!activeMonth}
              variant="secondary"
              icon={BookmarkPlus}
            >
              Save Preview
            </Button>
            <Button
              onClick={downloadCsv}
              disabled={!!downloadState || !activeMonth}
              variant="secondary"
              icon={FileSpreadsheet}
            >
              {downloadState === 'csv' ? 'Preparing CSV…' : 'Download CSV'}
            </Button>
            <Button
              onClick={downloadPdf}
              disabled={!!downloadState || !activeMonth}
              variant="ai"
              icon={FileDown}
            >
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
              <p className="text-[var(--text-main)]">Income <span className="float-right font-medium">{formatCurrency(report.totalIncome)}</span></p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report.totalIncome + report.totalExpense ? (report.totalIncome / (report.totalIncome + report.totalExpense)) * 100 : 0}%` }} /></div>
              <p className="text-[var(--text-main)]">Expenses <span className="float-right font-medium">{formatCurrency(report.totalExpense)}</span></p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${report.totalIncome + report.totalExpense ? (report.totalExpense / (report.totalIncome + report.totalExpense)) * 100 : 0}%` }} /></div>
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
          <h2 className="mb-4 text-base font-bold text-[var(--text-main)]">Expense by category</h2>
          {report.categories.length ? <ul className="space-y-3">
            {report.categories.map((category) => <li key={category.category} className="text-xs">
              <div className="flex justify-between gap-3 text-[var(--text-main)]"><span>{category.category}</span><span className="font-medium">{formatCurrency(category.amount)} · {category.percentage.toFixed(1)}%</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(category.percentage, 100)}%` }} /></div>
            </li>)}
          </ul> : <p className="text-xs text-[var(--text-muted)]">No expense transactions are recorded for this month.</p>}
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
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-[var(--text-main)]">Report History</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Saved monthly report previews that survive page refresh</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)] text-xs text-[var(--text-muted)] w-fit">
            <Info size={13} className="text-primary-500 shrink-0" />
            <span>Saved on this device only</span>
          </div>
        </div>

        {(!reportHistory || reportHistory.length === 0) ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[var(--border-base)] bg-[var(--bg-surface)]/50">
            <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[var(--text-main)]">No saved report previews yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Select a reporting month above and click &quot;Save Preview&quot; to keep it saved on this device across sessions.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-base)] border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
            {reportHistory.map((item) => (
              <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--bg-card)]/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-main)]">{item.title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">
                      {item.monthKey}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Saved: {new Date(item.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • {item.transactionCount} transactions
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500 font-semibold">Income: {formatCurrency(item.totalIncome)}</span>
                    <span className="text-rose-500 font-semibold">Expenses: {formatCurrency(item.totalExpense)}</span>
                    <span className={`font-bold ${item.netCashFlow >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                      Net: {formatCurrency(item.netCashFlow)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewModalReport(item);
                        setIsPreviewModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-base)] hover:border-primary-500/40 text-xs font-semibold transition-colors"
                      title="View printable report preview"
                    >
                      <Eye size={13} className="text-primary-500" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteReportPreview(item.id);
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                      title="Delete saved report"
                      aria-label="Delete report"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PDFPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewModalReport(null);
        }}
        reportData={previewModalReport}
      />

      <p className="text-xs text-[var(--text-muted)]">Budget comparisons are omitted because budget data is not connected to the authenticated report data source.</p>
    </div>
  );
};

export default Reports;
