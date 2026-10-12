import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { useBudget } from "../../context/BudgetContext";
import { CATEGORY_COLORS, CATEGORY_ICONS, getCategoryColor, getCategoryIcon } from "../../utils/categoryUtils";
import { X } from "lucide-react";
import clsx from "clsx";

const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
    const { getBudget, setBudget, deleteBudget } = useBudget();
    const [formData, setFormData] = useState({
        name: "",
        type: "expense",
        description: "",
        color: "",
        icon: ""
    });
    const [budgetAmount, setBudgetAmount] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (category) {
            // Get proper color object even for custom colors
            const categoryColor = getCategoryColor(category.name, category.color);
            setFormData({
                name: category.name || "",
                type: category.type || "expense",
                description: category.description || "",
                color: category.color || categoryColor.value,
                icon: category.icon || ""
            });
            const existingBudget = getBudget(category.name);
            setBudgetAmount(existingBudget ? existingBudget.toString() : "");
        } else {
            const defaultColor = CATEGORY_COLORS[0].value;
            setFormData({
                name: "",
                type: "expense",
                description: "",
                color: defaultColor,
                icon: ""
            });
            setBudgetAmount("");
        }
    }, [category, isOpen, getBudget]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(category?.id, formData);

            // Sync budget
            const newName = formData.name;
            const oldName = category?.name;

            if (category && oldName && newName !== oldName) {
                // Category was renamed - move the budget
                const existingBudget = getBudget(oldName);
                if (existingBudget) {
                    deleteBudget(oldName);
                    setBudget(newName, existingBudget);
                }
            }

            // Save/Update budget if provided in the input field
            const amount = parseFloat(budgetAmount);
            if (newName && !isNaN(amount) && amount > 0) {
                setBudget(newName, amount);
            } else if (newName && (isNaN(amount) || amount === 0)) {
                // Remove budget if cleared
                deleteBudget(newName);
            }

            onClose();
        } catch (error) {
            console.error("Failed to save category", error);
            alert("❌ Failed to save category: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-3xl shadow-premium w-full max-w-md overflow-hidden animate-zoom-in">
                <div className="px-6 py-5 border-b border-[var(--border-base)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                        {category ? "Edit Category" : "Add New Category"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all text-[var(--text-main)]"
                                placeholder="e.g., Food, Rent, Salary"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                Type
                            </label>
                            <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-base)] w-fit">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: "expense" })}
                                    className={clsx(
                                        "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                        formData.type === "expense" ? "bg-[var(--bg-card)] text-rose-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    )}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: "income" })}
                                    className={clsx(
                                        "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                        formData.type === "income" ? "bg-[var(--bg-card)] text-emerald-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    )}
                                >
                                    Income
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all text-[var(--text-main)] resize-none"
                                placeholder="Add a description..."
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                Category Color
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {CATEGORY_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                        className={clsx(
                                            "w-full h-10 rounded-xl transition-all duration-300 relative border border-black/5",
                                            formData.color === color.value ? "ring-2 ring-primary-500 ring-offset-4 ring-offset-[var(--bg-card)] scale-90" : "hover:scale-105"
                                        )}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                Category Icon
                            </label>
                            <div className="grid grid-cols-6 gap-3 p-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-base)]">
                                {CATEGORY_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon })}
                                        className={clsx(
                                            "w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all",
                                            getCategoryIcon(formData.name, formData.icon) === icon
                                                ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-premium border border-[var(--border-base)] scale-110"
                                                : "text-[var(--text-muted)] hover:bg-[var(--bg-card)]/50 hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.type === "expense" && (
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                    Monthly Budget (this browser)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={budgetAmount}
                                        onChange={(e) => setBudgetAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all text-[var(--text-main)] font-bold"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Saved locally in this browser; cross-device budget sync is Coming Soon.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={saving}
                            className="flex-1"
                        >
                            {category ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
