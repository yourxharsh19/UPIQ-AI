import { useState, useEffect } from "react";
import CategoryService from "../services/category.service";
import TransactionService from "../services/transaction.service";
import CategoryCard from "../components/categories/CategoryCard";
import CategoryModal from "../components/categories/CategoryModal";
import CategoryTransactionsModal from "../components/categories/CategoryTransactionsModal";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Plus, Download, Upload, Info, CheckCircle2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { useBudget } from "../context/BudgetContext";
import { useFinancial } from "../context/FinancialContext";
import { categoryListFromResponse } from "../utils/categoryData.js";
import { normalizeApiError } from "../services/safeApiError.js";

const DEFAULT_DEMO_CATEGORIES = [
    { id: 101, name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: '🍔', description: 'Restaurants, cafes, delivery' },
    { id: 102, name: 'Groceries', type: 'expense', color: '#10b981', icon: '🛒', description: 'Supermarket and daily supplies' },
    { id: 103, name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: '🛍️', description: 'Retail, electronics, apparel' },
    { id: 104, name: 'Transport', type: 'expense', color: '#3b82f6', icon: '🚗', description: 'Cabs, metro, fuel' },
    { id: 105, name: 'Bills & Utilities', type: 'expense', color: '#f59e0b', icon: '💡', description: 'Electricity, internet, water' },
    { id: 106, name: 'Salary', type: 'income', color: '#10b981', icon: '💰', description: 'Primary employment income' },
];

const Categories = () => {
    const { transactions: financialTransactions } = useFinancial();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [transactionCounts, setTransactionCounts] = useState({});
    const [allTransactions, setAllTransactions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const { deleteBudget, budgets, downloadBudgetsFile, importBudgets } = useBudget();
    const [budgetNotice, setBudgetNotice] = useState(null);

    const [loadError, setLoadError] = useState(null);

    const fetchCategories = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await CategoryService.getAll();
            setCategories(categoryListFromResponse(response));
        } catch (error) {
            const isDemo = typeof localStorage !== 'undefined' && localStorage.getItem('upiq_demo') === 'true';
            if (isDemo) {
                const cached = localStorage.getItem('upiq_demo_categories');
                if (cached) {
                    try {
                        setCategories(JSON.parse(cached));
                        setLoading(false);
                        return;
                    } catch {}
                }
                setCategories(DEFAULT_DEMO_CATEGORIES);
                try { localStorage.setItem('upiq_demo_categories', JSON.stringify(DEFAULT_DEMO_CATEGORIES)); } catch {}
                setLoading(false);
                return;
            }
            const status = error.response?.status;
            if (status !== 401 && status !== 403 && status !== 404) {
                setLoadError(error.response?.data?.message || "Failed to load categories. Please check connection and retry.");
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionCounts = async () => {
        try {
            const response = await TransactionService.getAll();
            if (Array.isArray(response.data)) {
                const transactions = response.data;
                setAllTransactions(transactions);

                const counts = {};
                transactions.forEach(t => {
                    const category = t.category || "Uncategorized";
                    counts[category] = (counts[category] || 0) + 1;
                });

                setTransactionCounts(counts);
            }
        } catch {
            setTransactionCounts({});
            setAllTransactions([]);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (Array.isArray(financialTransactions)) {
            setAllTransactions(financialTransactions);
            const counts = {};
            financialTransactions.forEach(t => {
                const category = t.category || t.raw?.category || "Uncategorized";
                counts[category] = (counts[category] || 0) + 1;
            });
            setTransactionCounts(counts);
        } else {
            fetchTransactionCounts();
        }
    }, [financialTransactions]);

    const handleAdd = () => {
        setCurrentCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setCurrentCategory(category);
        setIsModalOpen(true);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setIsTransactionModalOpen(true);
    };

    const handleSave = async (id, formData) => {
        const payload = {
            ...formData,
            type: formData.type.toLowerCase()
        };

        const isDemo = typeof localStorage !== 'undefined' && localStorage.getItem('upiq_demo') === 'true';
        if (isDemo) {
            let updated;
            if (id) {
                updated = categories.map(c => String(c.id) === String(id) ? { ...c, ...payload } : c);
            } else {
                const newCat = { ...payload, id: Date.now() };
                updated = [...categories, newCat];
            }
            setCategories(updated);
            try { localStorage.setItem('upiq_demo_categories', JSON.stringify(updated)); } catch {}
            setIsModalOpen(false);
            return;
        }

        if (id) {
            await CategoryService.update(id, payload);
        } else {
            await CategoryService.create(payload);
        }
        fetchCategories();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            const isDemo = typeof localStorage !== 'undefined' && localStorage.getItem('upiq_demo') === 'true';
            const categoryToDelete = categories.find(c => String(c.id) === String(id));

            if (isDemo) {
                if (categoryToDelete) {
                    deleteBudget(categoryToDelete.name);
                }
                const updated = categories.filter(c => String(c.id) !== String(id));
                setCategories(updated);
                try { localStorage.setItem('upiq_demo_categories', JSON.stringify(updated)); } catch {}
                setBudgetNotice({
                    type: "success",
                    message: `Category "${categoryToDelete?.name || ''}" deleted successfully.`,
                });
                return;
            }

            try {
                await CategoryService.delete(id);
                if (categoryToDelete) {
                    deleteBudget(categoryToDelete.name);
                }
                setCategories(categories.filter(c => String(c.id) !== String(id)));
                setBudgetNotice({
                    type: "success",
                    message: `Category "${categoryToDelete?.name || ''}" deleted successfully.`,
                });
            } catch (error) {
                setBudgetNotice({
                    type: "error",
                    message: "Failed to delete category: " + (error.response?.data?.message || error.message),
                });
            }
        }
    };

    const filteredCategories = categories.filter(c => {
        if (filter === "ALL") return true;
        return c.type?.toLowerCase() === filter.toLowerCase();
    });

    const handleExportBudgets = () => {
        try {
            downloadBudgetsFile();
            const count = Object.keys(budgets || {}).length;
            setBudgetNotice({
                type: "success",
                message: `Exported ${count} category budget${count === 1 ? '' : 's'} as JSON.`,
            });
        } catch (err) {
            setBudgetNotice({
                type: "error",
                message: "Failed to export budgets: " + err.message,
            });
        }
    };

    const handleImportBudgetsFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result;
                const imported = importBudgets(content);
                const count = Object.keys(imported).length;
                setBudgetNotice({
                    type: "success",
                    message: `Successfully imported ${count} category budget${count === 1 ? '' : 's'}.`,
                });
            } catch (err) {
                setBudgetNotice({
                    type: "error",
                    message: err.message || "Failed to import budgets.",
                });
            } finally {
                e.target.value = "";
            }
        };
        reader.onerror = () => {
            setBudgetNotice({
                type: "error",
                message: "Failed to read the selected file.",
            });
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">Categories</h1>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage your income and expense categories and local budget limits</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportBudgets}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-base)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                        title="Download category budgets as JSON"
                    >
                        <Download size={13} className="text-blue-500" />
                        Export Budgets
                    </button>
                    <label
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-base)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                        title="Load category budgets from a JSON file"
                    >
                        <Upload size={13} className="text-blue-500" />
                        Import Budgets
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleImportBudgetsFile}
                            className="hidden"
                        />
                    </label>
                    <Button
                        onClick={handleAdd}
                        size="md"
                    >
                        <Plus size={14} className="mr-1.5" />
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-blue-500 shrink-0" />
                    <span><strong>Device Storage:</strong> Budgets are saved on this device only. Use Export/Import to transfer budgets between devices.</span>
                </div>
                {budgetNotice && (
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border",
                        budgetNotice.type === "success"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                        {budgetNotice.type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        <span>{budgetNotice.message}</span>
                    </div>
                )}
            </div>

            <div className="flex bg-[var(--bg-surface)] p-1 rounded-lg w-fit border border-[var(--border-base)]">
                <button
                    onClick={() => setFilter("ALL")}
                    className={clsx(
                        "px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                        filter === "ALL" ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    )}
                >
                    All ({categories.length})
                </button>
                <button
                    onClick={() => setFilter("income")}
                    className={clsx(
                        "px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                        filter === "income" ? "bg-[var(--bg-card)] text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    )}
                >
                    Income ({categories.filter(c => c.type?.toLowerCase() === 'income').length})
                </button>
                <button
                    onClick={() => setFilter("expense")}
                    className={clsx(
                        "px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                        filter === "expense" ? "bg-[var(--bg-card)] text-rose-600 dark:text-rose-400 shadow-xs font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    )}
                >
                    Expense ({categories.filter(c => c.type?.toLowerCase() === 'expense').length})
                </button>
            </div>

            {loadError && (
                <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{loadError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={fetchCategories}
                        className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold text-xs hover:bg-[var(--bg-surface)] shrink-0 transition-colors cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-16 text-[var(--text-muted)] font-medium animate-pulse">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
                <Card>
                    <EmptyState
                        type="categories"
                        title={filter === "ALL" ? "No categories yet" : `No ${filter} categories found`}
                        description={filter === "ALL" ? "Create your first category to organize your income and expenses." : `Try a different filter or create a new ${filter} category.`}
                        actionLabel="Create Category"
                        onAction={handleAdd}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                        <CategoryCard
                            key={category.id || category.name}
                            category={category}
                            transactionCount={transactionCounts[category.name] || 0}
                            onClick={handleCategoryClick}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={currentCategory}
                onSave={handleSave}
            />

            <CategoryTransactionsModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                category={selectedCategory}
                transactions={allTransactions}
            />
        </div>
    );
};

export default Categories;
