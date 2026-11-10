import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileText,
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
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useFinancial } from '../context/FinancialContext';
import { normalizeApiError } from '../services/safeApiError.js';
import { CategoryChip } from '../components/transactions/CategoryChip';
import { AddEditTransactionModal } from '../components/transactions/AddEditTransactionModal';
import { StatementUploadModal } from '../components/transactions/StatementUploadModal';
import { TransactionDateFilter } from '../components/transactions/TransactionDateFilter';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { runAfterDeleteAllConfirmation } from '../utils/transactionOperations';

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
    dateRange,
    setDateRange,
  } = useTransactions();

  const { formatCurrency, deleteAllTransactions, addToast, openStatementModal } = useFinancial();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAll = async () => {
    if (isDeletingAll) return;

    setIsDeletingAll(true);
    try {
      const result = await runAfterDeleteAllConfirmation({
        confirm: (message) => window.confirm(message),
        action: deleteAllTransactions,
      });
      if (result.cancelled) return;
    } catch (error) {
      addToast('Could not delete transactions', normalizeApiError(error).message, 'danger');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const categoryConfigs = [
    { name: 'All', label: 'All', icon: Layers },
    { name: 'Food & Dining', label: 'Food & Dining', icon: Utensils },
    { name: 'Shopping', label: 'Shopping', icon: ShoppingBag },
    { name: 'Bills & Utilities', label: 'Bills & Utilities', icon: Zap },
    { name: 'Transport & Fuel', label: 'Transport & Fuel', icon: Car },
    { name: 'Entertainment', label: 'Entertainment', icon: Film },
    { name: 'Salary', label: 'Salary & Income', icon: Wallet },
    { name: 'Investments', label: 'Investments', icon: TrendingUp },
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
        };
      } else {
        const catTxList = list.filter((t) => t.category === cfg.name);
        const catTotal = catTxList.reduce((acc, t) => acc + (t.amount || 0), 0);
        stats[cfg.name] = {
          count: catTxList.length,
          total: catTotal,
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
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Transaction Ledger
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Review and organize your financial records, statement imports, and categories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={openStatementModal}
            variant="secondary"
            icon={FileText}
          >
            Import Statement
          </Button>
          <Button
            onClick={() => {
              setTxToEdit(null);
              setIsAddModalOpen(true);
            }}
            variant="primary"
            icon={Plus}
          >
            New Transaction
          </Button>
          <Button
            onClick={handleDeleteAll}
            variant="secondary"
            icon={Trash2}
            disabled={isDeletingAll}
            className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
          >
            {isDeletingAll ? 'Deleting…' : 'Delete All'}
          </Button>
        </div>
      </div>

      {/* CATEGORY PILL FILTER STRIP */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categoryConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const stat = categoryStats[cfg.name] || { count: 0, total: 0 };
          const isSelected = selectedCategory === cfg.name;

          return (
            <button
              key={cfg.name}
              type="button"
              onClick={() => setSelectedCategory(cfg.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-[var(--bg-card)] border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{cfg.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                }`}
              >
                {stat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-xl p-3 border border-[var(--border-base)] bg-[var(--bg-card)] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by merchant, title, or category..."
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
            className="px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)]"
          >
            {categoryConfigs.map((cfg) => (
              <option key={cfg.name} value={cfg.name}>
                {cfg.name === 'All' ? 'All Categories' : cfg.label}
              </option>
            ))}
          </select>

          <TransactionDateFilter dateRange={dateRange} setDateRange={setDateRange} />

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            aria-label="Filter by payment mode"
            className="px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)]"
          >
            <option value="All">All Modes</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="NetBanking">NetBanking</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort transactions"
            className="px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)]"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[var(--text-muted)] font-medium">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Description & Merchant</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-base)]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4">
                    {(!rawTransactions || rawTransactions.length === 0) ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-main)]">No Transactions Recorded Yet</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">Upload a bank statement (PDF or CSV) to extract transactions automatically, or add an entry manually.</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Button onClick={openStatementModal} variant="secondary" size="sm" icon={FileText}>
                            Upload Statement
                          </Button>
                          <Button onClick={() => { setTxToEdit(null); setIsAddModalOpen(true); }} variant="primary" size="sm" icon={Plus}>
                            New Transaction
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--text-muted)]">No transactions match your current date, search, category, or payment filters.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('All');
                            setSelectedMode('All');
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-4 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {tx.type === 'income' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="font-medium text-[var(--text-main)] block">
                            {tx.title}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">{tx.merchant}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <CategoryChip category={tx.category} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-base)] font-mono text-[10px]">
                        {tx.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">Not monitored</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-xs sm:text-sm">
                      <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1 text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--bg-surface)] rounded transition-colors cursor-pointer"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface)] rounded transition-colors cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
