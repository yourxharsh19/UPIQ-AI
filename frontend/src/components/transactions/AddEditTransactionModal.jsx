import React, { useEffect, useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { submitTransactionForm } from '../../utils/transactionOperations.js';

export const AddEditTransactionModal = ({ isOpen, onClose, transactionToEdit }) => {
  const { addTransaction, updateTransaction, predictCategory, currentCurrency } = useFinancial();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food & Dining');
  const [mode, setMode] = useState('UPI');
  const [merchant, setMerchant] = useState('');
  const [autoPredicted, setAutoPredicted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title || '');
      setAmount(transactionToEdit.amount || '');
      setType(transactionToEdit.type || 'expense');
      setCategory(transactionToEdit.category || 'Food & Dining');
      setMode(transactionToEdit.mode || 'UPI');
      setMerchant(transactionToEdit.merchant || '');
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory('Food & Dining');
      setMode('UPI');
      setMerchant('');
    }
  }, [transactionToEdit, isOpen]);

  // Handle live title changes to trigger Category suggestion
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!transactionToEdit && val.length > 2) {
      const predicted = predictCategory(val);
      setCategory(predicted);
      setAutoPredicted(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || isSaving) return;

    setIsSaving(true);
    try {
      await submitTransactionForm({
        save: () => transactionToEdit
          ? updateTransaction(transactionToEdit.id, {
            title,
            amount: parseFloat(amount),
            type,
            category,
            mode,
            merchant: merchant || title,
          })
          : addTransaction({
            title,
            amount: parseFloat(amount),
            type,
            category,
            mode,
            merchant: merchant || title,
          }),
        close: onClose,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    'Food & Dining',
    'Shopping',
    'Bills & Utilities',
    'Transport & Fuel',
    'Entertainment',
    'Salary',
    'Consulting',
    'Investments',
    'Healthcare',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Record New Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector toggle */}
        <div className="flex rounded-lg bg-[var(--bg-surface)] p-1 border border-[var(--border-base)]">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Income
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
            Transaction Description / Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Uber Ride or Coffee"
            className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
            Amount ({currentCurrency?.symbol || '₹'} {currentCurrency?.code || 'INR'}) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-medium text-[var(--text-muted)]">{currentCurrency?.symbol || '₹'}</span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs font-semibold tabular-nums text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Category & Auto prediction badge */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[var(--text-main)]">
              Category
            </label>
            {autoPredicted && (
              <Badge variant="info" size="sm">
                Rule Suggested
              </Badge>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setAutoPredicted(false);
            }}
            className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Mode & Merchant */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
              Payment Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            >
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="NetBanking">NetBanking</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
              Merchant Name
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Uber Tech"
              className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-base)]">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant={type === 'expense' ? 'rose' : 'emerald'} disabled={isSaving}>
            {isSaving ? 'Saving…' : transactionToEdit ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
