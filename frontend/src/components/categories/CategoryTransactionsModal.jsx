import { X } from "lucide-react";
import Button from "../ui/Button";
import clsx from "clsx";

const CategoryTransactionsModal = ({ isOpen, onClose, category, transactions = [] }) => {
    if (!isOpen || !category) return null;

    const txList = Array.isArray(transactions) ? transactions : [];

    // Case-insensitive filtering with trimming
    const categoryTransactions = txList.filter(t => {
        const transactionCategory = (t.category || t.raw?.category || "").trim().toLowerCase();
        const targetCategory = (category.name || "").trim().toLowerCase();
        return transactionCategory === targetCategory;
    });

    const totalAmount = categoryTransactions.reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-base)] w-full max-w-lg max-h-[85vh] overflow-hidden animate-zoom-in flex flex-col">
                <div className="px-6 py-5 border-b border-[var(--border-base)] flex justify-between items-center bg-[var(--bg-surface)]">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
                            {category.name} Transactions
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[var(--border-base)]" />
                            <span className="text-xs font-semibold text-[var(--text-main)] tabular-nums">
                                Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] rounded-lg transition-colors cursor-pointer"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {categoryTransactions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-[var(--bg-surface)] w-12 h-12 rounded-xl border border-[var(--border-base)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
                                <X size={24} />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] font-medium">No transactions found for this category</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {categoryTransactions.map((transaction) => {
                                const isIncome = transaction.type?.toLowerCase() === 'income';
                                const parsedDate = transaction.date ? new Date(transaction.date) : null;
                                const dateStr = parsedDate && !isNaN(parsedDate.getTime())
                                    ? parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Recent';

                                return (
                                    <div
                                        key={transaction.id || Math.random()}
                                        className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg hover:bg-[var(--bg-card)] transition-colors duration-150"
                                    >
                                        <div className="flex justify-between items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-xs sm:text-sm text-[var(--text-main)] truncate leading-snug">
                                                    {transaction.description || transaction.title || 'Transaction'}
                                                </h3>
                                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                    {dateStr}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={clsx(
                                                    "text-xs sm:text-sm font-bold tracking-tight tabular-nums",
                                                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                )}>
                                                    {isIncome ? '+' : '-'} ₹{Number(transaction.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <span className={clsx(
                                                    "inline-flex px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded border mt-0.5",
                                                    isIncome
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                )}>
                                                    {transaction.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3.5 border-t border-[var(--border-base)] bg-[var(--bg-surface)] flex justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        size="sm"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CategoryTransactionsModal;
