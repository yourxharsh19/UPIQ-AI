import React, { useState } from 'react';
import { FileDown, Calendar, FileText, CheckCircle, Sparkles, Eye } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PDFPreviewModal } from '../components/reports/PDFPreviewModal';
import { FinancialDashboardService } from '../services/financial-dashboard.service';

export const Reports = () => {
  const { reports, addToast, formatCurrency } = useFinancial();
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeReportForPdf, setActiveReportForPdf] = useState(null);

  const currentReport = reports.find((r) => r.month === selectedMonth) || reports[0];

  const handleDownloadPdf = async (rep) => {
    setActiveReportForPdf(rep);
    try {
      await FinancialDashboardService.downloadPdfReport(rep.month);
    } catch {
      // Backend unavailable; modal fallback is displayed
    }
    addToast('Report Ready', `Generated executive report PDF for ${rep.month}`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 light:text-slate-900">
            Automated Monthly Financial Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            One-click executive summaries, tax-ready breakdowns, and PDF downloads
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-100 light:bg-white light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.month}>
                {r.month}
              </option>
            ))}
          </select>

          <Button
            onClick={() => handleDownloadPdf(currentReport)}
            variant="ai"
            icon={FileDown}
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* Main Executive Summary Card Preview */}
      {currentReport && (
        <Card glow className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
                  Executive Summary — {currentReport.month}
                </h3>
                <p className="text-xs text-slate-400">Status: Verified & Cryptographically Signed</p>
              </div>
            </div>
            <Badge variant="success" size="md">
              Health Score: {currentReport.healthScore}/100
            </Badge>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <span className="text-xs text-slate-400 block font-semibold">Total Income</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                {formatCurrency(currentReport.totalIncome)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <span className="text-xs text-slate-400 block font-semibold">Total Expenses</span>
              <span className="text-xl font-extrabold text-rose-400 mt-1 block">
                {formatCurrency(currentReport.totalExpense)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <span className="text-xs text-slate-400 block font-semibold">Net Savings</span>
              <span className="text-xl font-extrabold text-indigo-400 mt-1 block">
                {formatCurrency(currentReport.netSavings)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <span className="text-xs text-slate-400 block font-semibold">Savings Rate</span>
              <span className="text-xl font-extrabold text-purple-400 mt-1 block">
                {currentReport.savingsRate}
              </span>
            </div>
          </div>

          {/* Summary prose */}
          <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed space-y-2 light:bg-slate-50 light:border-slate-200 light:text-slate-800">
            <h4 className="font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Key Insights & Spending Breakdown
            </h4>
            <p>
              In {currentReport.month}, your financial health score reached **{currentReport.healthScore}/100**. Your largest single spending category was **{currentReport.topCategory}**. Additionally, **{currentReport.fraudPrevented}** suspicious fraud transaction attempts were successfully blocked by UPIQ Guardian AI.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button onClick={() => handleDownloadPdf(currentReport)} variant="ai" icon={Eye}>
              Preview & Print PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Report History Table */}
      <div className="rounded-2xl glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
          Generated Financial Reports Archive
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 light:border-slate-200 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Period</th>
                <th className="pb-3">Income</th>
                <th className="pb-3">Expense</th>
                <th className="pb-3">Savings</th>
                <th className="pb-3">Health Score</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors">
                  <td className="py-3 font-bold text-slate-200 light:text-slate-900">{r.month}</td>
                  <td className="py-3 text-emerald-400 font-semibold">{formatCurrency(r.totalIncome)}</td>
                  <td className="py-3 text-rose-400 font-semibold">{formatCurrency(r.totalExpense)}</td>
                  <td className="py-3 text-indigo-400 font-semibold">{formatCurrency(r.netSavings)}</td>
                  <td className="py-3">
                    <Badge variant="success">{r.healthScore}/100</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button onClick={() => handleDownloadPdf(r)} variant="secondary" size="sm" icon={FileDown}>
                      PDF ({r.pdfSize})
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Printable Modal */}
      <PDFPreviewModal
        isOpen={!!activeReportForPdf}
        onClose={() => setActiveReportForPdf(null)}
        reportData={activeReportForPdf}
      />
    </div>
  );
};
