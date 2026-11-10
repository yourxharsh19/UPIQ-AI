import { Edit2, Trash2 } from "lucide-react";
import { getCategoryDisplayProps } from "../../utils/categoryUtils";
import clsx from "clsx";

const CategoryCard = ({ category, transactionCount = 0, onClick, onEdit, onDelete }) => {
    const displayProps = getCategoryDisplayProps(category);
    const isValidHex = typeof displayProps.colorValue === 'string' && /^#[0-9A-Fa-f]{6}$/.test(displayProps.colorValue);
    const safeHex = isValidHex ? displayProps.colorValue : '#3b82f6';
    const isIncome = category.type?.toLowerCase() === 'income';

    const handleCardClick = () => {
        if (transactionCount > 0) {
            onClick(category);
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(category);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(category.id);
    };

    return (
        <div
            onClick={handleCardClick}
            className={clsx(
                "relative bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-base)] shadow-xs hover:border-[var(--border-hover)] transition-colors group",
                transactionCount > 0 ? 'cursor-pointer' : ''
            )}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div
                            className="w-8 h-8 rounded-lg border flex items-center justify-center text-base shrink-0"
                            style={{
                                backgroundColor: `${safeHex}15`,
                                borderColor: `${safeHex}30`
                            }}
                        >
                            {displayProps.icon}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-[var(--text-main)] truncate">{category.name}</h3>
                            <span
                                className={clsx(
                                    "inline-flex px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider border",
                                    isIncome
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                )}
                            >
                                {category.type || 'expense'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        {transactionCount > 0 ? (
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                                style={{
                                    backgroundColor: `${safeHex}12`,
                                    color: safeHex,
                                    borderColor: `${safeHex}25`
                                }}
                            >
                                {transactionCount} Transaction{transactionCount === 1 ? '' : 's'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-base)]">
                                No activity
                            </span>
                        )}
                    </div>

                    {category.description && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{category.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-1 ml-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleEdit}
                        className="p-1 text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--bg-surface)] rounded transition-colors cursor-pointer"
                        title="Edit category"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1 text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface)] rounded transition-colors cursor-pointer"
                        title="Delete category"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryCard;
