import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  UploadCloud,
  FileText,
  Receipt,
  Filter,
  Trash2,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Utensils,
  ShoppingBag,
  Zap,
  Car,
  Film,
  Wallet,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useFinancial } from '../context/FinancialContext';
import { CategoryChip } from '../components/transactions/CategoryChip';
import { AddEditTransactionModal } from '../components/transactions/AddEditTransactionModal';
import { ReceiptScannerModal } from '../components/transactions/ReceiptScannerModal';
import { StatementUploadModal } from '../components/transactions/StatementUploadModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const Transactions = () => {
  const {
    transactions,
    rawTransactions,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedMode,
    setSelectedMode,
    sortBy,
    setSortBy,
    deleteTransaction,
  } = useTransactions();

  const { setIsFraudDrawerOpen, formatCurrency } = useFinancial();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState(null);

  // Category Configuration with icons & colors
  const categoryConfigs = [
    { name: 'All', label: 'All Categories', icon: Layers, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Food & Dining', label: 'Food & Dining', icon: Utensils, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { name: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { name: 'Bills & Utilities', label: 'Bills & Utilities', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { name: 'Transport & Fuel', label: 'Transport & Fuel', icon: Car, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { name: 'Entertainment', label: 'Entertainment', icon: Film, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { name: 'Salary', label: 'Salary & Income', icon: Wallet, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Investments', label: 'Investments', icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  ];

  // Calculate dynamic stats per category from rawTransactions
  const categoryStats = useMemo(() => {
    const list = rawTransactions || [];
    const totalExpense = list
      .filter((t) => t.type !== 'income')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const stats = {};

    categoryConfigs.forEach((cfg) => {
      if (cfg.name === 'All') {
        stats['All'] = {
          count: list.length,
          total: totalExpense,
          percent: 100,
        };
      } else {
        const catTxList = list.filter((t) => t.category === cfg.name);
        const catTotal = catTxList.reduce((acc, t) => acc + (t.amount || 0), 0);
        const pct = totalExpense > 0 ? Math.min(100, Math.round((catTotal / totalExpense) * 100)) : 0;
        stats[cfg.name] = {
          count: catTxList.length,
          total: catTotal,
          percent: pct,
        };
      }
    });

    return stats;
  }, [rawTransactions]);

  const handleEdit = (tx) => {
    setTxToEdit(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 light:text-slate-900">
            Automated Transaction Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time categorized records, receipt uploads, and risk scores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsStatementModalOpen(true)}
            variant="ai"
            icon={FileText}
          >
            Upload Bank Statement
          </Button>
          <Button
            onClick={() => setIsReceiptModalOpen(true)}
            variant="secondary"
            icon={Receipt}
          >
            Scan Bill / Receipt
          </Button>
          <Button
            onClick={() => {
              setTxToEdit(null);
              setIsAddModalOpen(true);
            }}
            variant="emerald"
            icon={Plus}
          >
            New Transaction
          </Button>
        </div>
      </div>

      {/* TRANSACTION CATEGORY SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200 light:text-slate-900">
              Transaction Category Breakdown
            </h2>
          </div>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Reset Filter (Showing {selectedCategory}) &times;
            </button>
          )}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categoryConfigs.map((cfg) => {
            const Icon = cfg.icon;
            const stat = categoryStats[cfg.name] || { count: 0, total: 0, percent: 0 };
            const isSelected = selectedCategory === cfg.name;

            return (
              <button
                key={cfg.name}
                type="button"
                onClick={() => setSelectedCategory(cfg.name)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/20 ring-2 ring-indigo-500/50 scale-[1.02]'
                    : 'glass-panel border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {stat.count} txs
                  </span>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-200 light:text-slate-900 truncate">
                    {cfg.label}
                  </p>
                  <p className="text-xs font-extrabold text-slate-100 light:text-slate-900">
                    {formatCurrency(stat.total)}
                  </p>
                </div>

                {/* Micro Share Bar */}
                {cfg.name !== 'All' && (
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl p-4 glass-panel flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by merchant, title, category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 light:bg-white light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800"
          >
            {categoryConfigs.map((cfg) => (
              <option key={cfg.name} value={cfg.name}>
                {cfg.name === 'All' ? 'All Categories' : cfg.label}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800"
          >
            <option value="All">All Modes</option>
            <option value="UPI">UPI Only</option>
            <option value="Card">Card Only</option>
            <option value="NetBanking">NetBanking Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-2xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 light:bg-slate-100 border-b border-slate-800 light:border-slate-200 text-slate-400 font-semibold uppercase">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Description & Merchant</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">AI Risk Indicator</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No transactions match your current search and category filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors">
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-100 light:text-slate-900 block">
                            {tx.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{tx.merchant}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <CategoryChip category={tx.category} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px] light:bg-slate-100 light:text-slate-800">
                        {tx.mode}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {tx.isFraud ? (
                        <button onClick={() => setIsFraudDrawerOpen(true)} className="cursor-pointer">
                          <Badge variant="fraud">Flagged Fraud</Badge>
                        </button>
                      ) : tx.isAnomaly ? (
                        <Badge variant="anomaly">High Anomaly</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-sm">
                      <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100 light:text-slate-900'}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddEditTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        transactionToEdit={txToEdit}
      />
      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
      <StatementUploadModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
      />
    </div>
  );
};
