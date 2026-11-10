import { X, IndianRupee } from "lucide-react";
import Button from "../ui/Button";
import clsx from "clsx";

const CategoryTransactionsModal = ({ isOpen, onClose, category, transactions }) => {
    if (!isOpen || !category) return null;

    // Case-insensitive filtering with trimming
    const categoryTransactions = transactions.filter(t => {
        const transactionCategory = (t.category || "").trim().toLowerCase();
        const targetCategory = (category.name || "").trim().toLowerCase();
        return transactionCategory === targetCategory;
    });

    const totalAmount = categoryTransactions.reduce(
        (sum, t) => sum + (t.amount || 0),
        0
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-3xl shadow-premium w-full max-w-lg max-h-[85vh] overflow-hidden animate-zoom-in flex flex-col">
                <div className="px-6 py-6 border-b border-[var(--border-base)] flex justify-between items-center bg-[var(--bg-surface)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                            {category.name} Transactions
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[var(--border-base)]" />
                            <span className="text-sm font-bold text-[var(--text-main)]">
                                Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {categoryTransactions.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-[var(--bg-surface)] w-16 h-16 rounded-2xl border border-[var(--border-base)] flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                                <X size={32} />
                            </div>
                            <p className="text-[var(--text-muted)] font-medium">No transactions found for this category</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categoryTransactions.map((transaction) => {
                                const isIncome = transaction.type?.toLowerCase() === 'income';
                                return (
                                    <div
                                        key={transaction.id}
                                        className="group p-4 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl hover:bg-[var(--bg-card)] hover:shadow-premium transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-[var(--text-main)] leading-tight">
                                                    {transaction.description}
                                                </h3>
                                                <p className="text-xs font-medium text-[var(--text-muted)] mt-1 tracking-tight">
                                                    {new Date(transaction.date).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={clsx(
                                                    "text-base font-bold tracking-tight",
                                                    isIncome ? 'text-emerald-600' : 'text-rose-600'
                                                )}>
                                                    {isIncome ? '+' : '-'} ₹{transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <span className={clsx(
                                                    "inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full mt-1 border",
                                                    isIncome
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
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

                <div className="px-6 py-4 border-t border-[var(--border-base)] bg-[var(--bg-surface)] flex justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        size="md"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CategoryTransactionsModal;
