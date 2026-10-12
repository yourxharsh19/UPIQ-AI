import { useState, useEffect } from "react";
import CategoryService from "../services/category.service";
import TransactionService from "../services/transaction.service";
import CategoryCard from "../components/categories/CategoryCard";
import CategoryModal from "../components/categories/CategoryModal";
import CategoryTransactionsModal from "../components/categories/CategoryTransactionsModal";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { useBudget } from "../context/BudgetContext";
import { categoryListFromResponse } from "../utils/categoryData.js";

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [transactionCounts, setTransactionCounts] = useState({});
    const [allTransactions, setAllTransactions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const { deleteBudget } = useBudget();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await CategoryService.getAll();
            setCategories(categoryListFromResponse(response));
        } catch (error) {
            const status = error.response?.status;
            if (status && status !== 401 && status !== 403 && status !== 404) {
                alert("Failed to load categories. Please try again.");
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionCounts = async () => {
        try {
            const response = await TransactionService.getAll();

            // The API returns { success: true, data: [...], message: "..." }
            // So transactions are in response.data, not response.data.data
            if (Array.isArray(response.data)) {
                const transactions = response.data;
                setAllTransactions(transactions);

                // Count transactions per category
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
        fetchTransactionCounts();
    }, []);

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
            try {
                const categoryToDelete = categories.find(c => c.id === id);
                await CategoryService.delete(id);
                if (categoryToDelete) {
                    deleteBudget(categoryToDelete.name);
                }
                setCategories(categories.filter(c => c.id !== id));
            } catch (error) {
                alert("Failed to delete category: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const filteredCategories = categories.filter(c => {
        if (filter === "ALL") return true;
        return c.type?.toLowerCase() === filter.toLowerCase();
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Categories</h1>
                    <p className="text-[var(--text-muted)] mt-1">Manage your income and expense categories</p>
                </div>
                <Button
                    onClick={handleAdd}
                    className="group"
                >
                    <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Add Category
                </Button>
            </div>

            <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-2xl w-fit border border-[var(--border-base)]">
                <button
                    onClick={() => setFilter("ALL")}
                    className={clsx(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        filter === "ALL" ? "bg-[var(--bg-card)] text-primary-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    )}
                >
                    All ({categories.length})
                </button>
                <button
                    onClick={() => setFilter("income")}
                    className={clsx(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        filter === "income" ? "bg-[var(--bg-card)] text-emerald-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    )}
                >
                    Income ({categories.filter(c => c.type?.toLowerCase() === 'income').length})
                </button>
                <button
                    onClick={() => setFilter("expense")}
                    className={clsx(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        filter === "expense" ? "bg-[var(--bg-card)] text-rose-600 shadow-sm border border-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    )}
                >
                    Expense ({categories.filter(c => c.type?.toLowerCase() === 'expense').length})
                </button>
            </div>

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
                            key={category.id}
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
