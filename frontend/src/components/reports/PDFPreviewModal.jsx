import React from 'react';
import { Printer, ShieldCheck, Sparkles, Info } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinancial } from '../../context/FinancialContext';
import { formatMonthLabel } from '../../utils/monthlyReport.js';

export const PDFPreviewModal = ({ isOpen, onClose, reportData }) => {
  const { formatCurrency, openStatementModal } = useFinancial();
  if (!reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = reportData.month
    ? reportData.month
    : (reportData.monthKey ? formatMonthLabel(reportData.monthKey) : 'Monthly Statement');

  const totalIncome = Number(reportData.totalIncome) || 0;
  const totalExpense = Number(reportData.totalExpense) || 0;
  const netSavings = reportData.netSavings !== undefined
    ? Number(reportData.netSavings)
    : (Number(reportData.netCashFlow) || (totalIncome - totalExpense));

  const calculatedRate = totalIncome > 0
    ? `${Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)}%`
    : '0%';
  const savingsRate = reportData.savingsRate || calculatedRate;
  const topCategory = reportData.topCategory || reportData.categories?.[0]?.category || 'General';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Financial Report Preview" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Printable Document Container */}
        <div id="printable-report" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-xl space-y-6 text-slate-900 dark:text-slate-100">
          {/* Document Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs tracking-wider">
                  UPIQ
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  UPIQ AI FINANCIAL STATEMENT
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Period: {periodLabel}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                <Info size={11} /> Saved on this device only
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Snapshot from account ledger</p>
            </div>
          </div>

          {/* KPI Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Total Income</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Total Expenses</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalExpense)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Net Cash Flow</span>
              <span className={`text-sm font-bold ${netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(netSavings)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Savings Rate</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {savingsRate}
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" /> Ledger Summary
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              During <strong>{periodLabel}</strong>, total recorded income was <strong>{formatCurrency(totalIncome)}</strong> against <strong>{formatCurrency(totalExpense)}</strong> in expenses. Net cash flow ended at <strong>{formatCurrency(netSavings)}</strong> (savings rate: <strong>{savingsRate}</strong>). The highest expense category was <strong>{topCategory}</strong>.
            </p>
          </div>

          {/* Verification stamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-500" /> Account Ledger Statement
            </div>
            <span>Document ID: {reportData.id || `DOC-${Date.now()}`}</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {reportData.transactionCount === 0 && openStatementModal ? (
            <Button
              onClick={() => {
                onClose();
                openStatementModal();
              }}
              variant="secondary"
              size="sm"
            >
              Upload Statement
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
            <Button onClick={handlePrint} variant="primary" icon={Printer}>
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
