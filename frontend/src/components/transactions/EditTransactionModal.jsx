import { useState, useEffect } from "react";
import Button from "../ui/Button";
import CategoryService from "../../services/category.service";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import { normalizeApiError } from "../../services/safeApiError.js";

const EditTransactionModal = ({ isOpen, onClose, transaction, onSave }) => {
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        type: "EXPENSE",
        date: "",
        paymentMethod: "UPI"
    });
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Fetch categories when modal opens or type changes
    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, formData.type]);

    useEffect(() => {
        if (transaction) {
            setFormData({
                description: transaction.description || "",
                amount: transaction.amount || "",
                category: transaction.category || "Uncategorized",
                type: transaction.type || "EXPENSE",
                date: transaction.date || new Date().toISOString(),
                paymentMethod: transaction.paymentMethod || "UPI"
            });
        }
    }, [transaction]);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await CategoryService.getAll();
            if (response.data && response.data.data) {
                // Filter categories by transaction type
                const transactionType = formData.type.toLowerCase();
                const filtered = response.data.data.filter(cat =>
                    cat.type.toLowerCase() === transactionType
                );
                setCategories(filtered);
            }
        } catch (error) {
            console.warn("Failed to fetch categories", { status: error.response?.status || null, code: error.code || null });
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleQuickAddCategory = async () => {
        const categoryName = formData.category.trim();

        if (!categoryName) {
            alert("Please enter a category name");
            return;
        }

        // Check if category already exists
        if (categories.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
            alert("This category already exists!");
            return;
        }

        setCreatingCategory(true);
        try {
            await CategoryService.create({
                name: categoryName,
                type: formData.type.toLowerCase(),
                description: `Created from transaction`
            });

            // Refresh categories list
            await fetchCategories();
            alert(`✅ Category "${categoryName}" created successfully!`);
        } catch (error) {
            console.warn("Failed to create category", { status: error.response?.status || null, code: error.code || null });
            alert("❌ Failed to create category: " + normalizeApiError(error).message);
        } finally {
            setCreatingCategory(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(transaction.id, {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            onClose();
        } catch (error) {
            console.warn("Failed to save transaction", { status: error.response?.status || null, code: error.code || null });
            alert("Failed to save transaction: " + normalizeApiError(error).message);
        } finally {
            setSaving(false);
        }
    };

    // Default fallback categories
    const defaultCategories = [
        "Food", "Groceries", "Shopping", "Transport", "Bills & Utilities",
        "Entertainment", "Health", "Salary", "Investment", "Other"
    ];

    // Combine user categories with defaults
    const allCategories = [
        ...categories.map(c => c.name),
        ...defaultCategories.filter(dc => !categories.some(c => c.name === dc))
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-base)] w-full max-w-md overflow-hidden animate-zoom-in">
                <div className="px-6 py-5 border-b border-[var(--border-base)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Edit Transaction</h2>
                    <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all text-[var(--text-main)]"
                                placeholder="Description"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full pl-8 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all text-[var(--text-main)] font-bold"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Type</label>
                                <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-base)] w-full">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                            formData.type === "EXPENSE" ? "bg-[var(--bg-card)] text-rose-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "INCOME" })}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                            formData.type === "INCOME" ? "bg-[var(--bg-card)] text-emerald-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                Category {loadingCategories && <span className="text-[10px] font-medium lowercase text-primary-500">(loading...)</span>}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    list="category-suggestions"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all text-[var(--text-main)]"
                                    placeholder="Select or type a category"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleQuickAddCategory}
                                    disabled={creatingCategory || !formData.category.trim()}
                                    className="px-4 py-2 bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 rounded-xl hover:bg-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                                >
                                    <Plus size={16} />
                                    {creatingCategory ? "..." : "Add"}
                                </button>
                            </div>
                            <datalist id="category-suggestions">
                                {allCategories.map((cat) => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
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
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
