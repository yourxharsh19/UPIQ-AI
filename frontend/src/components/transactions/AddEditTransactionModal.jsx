import React, { useEffect, useState } from 'react';
import { Sparkles, DollarSign, Tag, CreditCard, Layers } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const AddEditTransactionModal = ({ isOpen, onClose, transactionToEdit }) => {
  const { addTransaction, updateTransaction, predictCategory, currentCurrency } = useFinancial();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food & Dining');
  const [mode, setMode] = useState('UPI');
  const [merchant, setMerchant] = useState('');
  const [autoPredicted, setAutoPredicted] = useState(false);

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

  // Handle live title changes to trigger AI Category prediction
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!transactionToEdit && val.length > 2) {
      const predicted = predictCategory(val);
      setCategory(predicted);
      setAutoPredicted(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        title,
        amount: parseFloat(amount),
        type,
        category,
        mode,
        merchant: merchant || title,
      });
    } else {
      addTransaction({
        title,
        amount: parseFloat(amount),
        type,
        category,
        mode,
        merchant: merchant || title,
      });
    }

    onClose();
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
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 light:bg-slate-100">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 light:text-slate-700">
            Transaction Description / Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Uber Ride to Airport or Starbucks Coffee"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 light:bg-slate-50 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 light:text-slate-700">
            Amount ({currentCurrency?.symbol || '₹'} {currentCurrency?.code || 'INR'}) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">{currentCurrency?.symbol || '₹'}</span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100 light:bg-slate-50 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category & Auto prediction badge */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 light:text-slate-700">
              Category
            </label>
            {autoPredicted && (
              <Badge variant="ai" size="sm">
                AI Auto-Categorized
              </Badge>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setAutoPredicted(false);
            }}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 light:bg-slate-50 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 light:text-slate-700">
              Payment Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 light:bg-slate-50 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="UPI">UPI Payment</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="NetBanking">NetBanking / Wire</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 light:text-slate-700">
              Merchant Name
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Uber Tech Inc"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 light:bg-slate-50 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={type === 'expense' ? 'rose' : 'emerald'}>
            {transactionToEdit ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
