import { useMemo, useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { createDateRangePreset, filterTransactionsByDateRange } from '../utils/transactionFilters';

export const useTransactions = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, predictCategory } = useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateRange, setDateRange] = useState(() => createDateRangePreset('this-month'));

  const dateFilteredTransactions = useMemo(
    () => filterTransactionsByDateRange(transactions, dateRange),
    [transactions, dateRange],
  );

  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions
      .filter((tx) => {
        const matchesSearch =
          tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
        const matchesMode = selectedMode === 'All' || tx.mode === selectedMode;
        const matchesType = selectedType === 'All' || tx.type === selectedType;

        return matchesSearch && matchesCategory && matchesMode && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [dateFilteredTransactions, searchTerm, selectedCategory, selectedMode, selectedType, sortBy]);

  return {
    transactions: filteredTransactions,
    rawTransactions: dateFilteredTransactions,
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedMode,
    setSelectedMode,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    predictCategory,
  };
};
