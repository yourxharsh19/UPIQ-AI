import { Edit2, Trash2 } from "lucide-react";
import { getCategoryDisplayProps } from "../../utils/categoryUtils";
import EmptyState from "../ui/EmptyState";
import clsx from "clsx";

const TransactionTable = ({ transactions, onEdit, onDelete }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-base)]">
                <EmptyState type="transactions" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden bg-[var(--bg-card)] rounded-xl border border-[var(--border-base)] shadow-xs transition-colors">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[var(--border-base)] text-xs">
                        <thead className="bg-[var(--bg-surface)]">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium text-[var(--text-muted)]">Date</th>
                                <th className="px-5 py-3 text-left font-medium text-[var(--text-muted)]">Description</th>
                                <th className="px-5 py-3 text-left font-medium text-[var(--text-muted)]">Category</th>
                                <th className="px-5 py-3 text-left font-medium text-[var(--text-muted)]">Type</th>
                                <th className="px-5 py-3 text-left font-medium text-[var(--text-muted)]">Amount</th>
                                <th className="px-5 py-3 text-right font-medium text-[var(--text-muted)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-[var(--bg-card)] divide-y divide-[var(--border-base)]">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-[var(--bg-surface)] transition-colors group">
                                    <td className="px-5 py-3 whitespace-nowrap text-[var(--text-muted)] font-mono text-[11px]">
                                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap font-medium text-[var(--text-main)]">
                                        {t.description}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-[var(--text-muted)]">
                                        {(() => {
                                            const categoryDisplay = getCategoryDisplayProps({ name: t.category });
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-main)]">
                                                    <span>{categoryDisplay.icon}</span>
                                                    {t.category || "Uncategorized"}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className={clsx(
                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                                            t.type?.toLowerCase() === 'income' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        )}>
                                            {t.type?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={clsx(
                                        "px-5 py-3 whitespace-nowrap font-semibold tabular-nums",
                                        t.type?.toLowerCase() === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'
                                    )}>
                                        ₹{t.amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-right font-medium">
                                        <div className="flex justify-end space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(t)}
                                                className="p-1 text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--bg-surface)] rounded transition-colors cursor-pointer"
                                                title="Edit"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(t.id)}
                                                className="p-1 text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface)] rounded transition-colors cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {transactions.map((t) => {
                    const categoryDisplay = getCategoryDisplayProps({ name: t.category });
                    const isIncome = t.type?.toLowerCase() === 'income';
                    return (
                        <div key={t.id} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-base)] shadow-xs space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-mono text-[var(--text-muted)]">
                                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                    <h4 className="text-sm font-semibold text-[var(--text-main)]">
                                        {t.description}
                                    </h4>
                                </div>
                                <p className={clsx(
                                    "text-base font-bold tabular-nums",
                                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                )}>
                                    {isIncome ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-main)]">
                                    <span>{categoryDisplay.icon}</span>
                                    {t.category || "Uncategorized"}
                                </span>
                                <span className={clsx(
                                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                                    isIncome ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                )}>
                                    {t.type?.toUpperCase()}
                                </span>
                            </div>

                            <div className="pt-2.5 border-t border-[var(--border-base)] flex justify-end gap-2">
                                <button
                                    onClick={() => onEdit(t)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 dark:text-blue-400 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg transition-colors font-medium text-xs cursor-pointer"
                                >
                                    <Edit2 size={13} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(t.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 dark:text-rose-400 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg transition-colors font-medium text-xs cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TransactionTable;
