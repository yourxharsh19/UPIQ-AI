import { Upload, FileText, TrendingUp, ArrowRight } from "lucide-react";
import Button from "./Button";
import { useFinancial } from "../../context/FinancialContext";

const EmptyState = ({
  type = "transactions",
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  icon: CustomIcon
}) => {
  let financial = null;
  try {
    financial = useFinancial();
  } catch {
    financial = null;
  }
  const setActiveTab = financial?.setActiveTab;
  const openStatementModal = financial?.openStatementModal;

  const configs = {
    transactions: {
      icon: FileText,
      title: "No transactions yet",
      description: "Upload your first statement PDF to start tracking your expenses automatically.",
      actionLabel: "Upload Statement",
      actionPath: "/upload"
    },
    categories: {
      icon: TrendingUp,
      title: "No categories yet",
      description: "Create your first category to organize your income and expenses.",
      actionLabel: "Create Category",
      actionPath: "/categories"
    },
    dashboard: {
      icon: Upload,
      title: "Welcome to UPIQ!",
      description: "Get started by uploading your first statement statement. We'll automatically extract and categorize your transactions.",
      actionLabel: "Upload Statement",
      actionPath: "/upload"
    }
  };

  const config = configs[type] || {
    icon: CustomIcon || FileText,
    title: title || "No data available",
    description: description || "Get started by adding some data.",
    actionLabel: actionLabel || "Get Started",
    actionPath: actionPath || "/dashboard"
  };

  const Icon = config.icon;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (config.actionPath) {
      const tab = config.actionPath.replace(/^\//, '').toLowerCase();
      if (tab === 'upload') {
        if (openStatementModal) {
          openStatementModal();
        } else if (setActiveTab) {
          setActiveTab('transactions');
        }
      } else if (setActiveTab) {
        setActiveTab(tab);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 rounded-xl">
          <Icon size={28} className="text-[var(--text-muted)]" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 text-center tracking-tight">
        {config.title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] text-center max-w-sm mb-6 leading-relaxed">
        {config.description}
      </p>

      {(onAction || config.actionPath || config.actionLabel) && (
        <Button size="sm" onClick={handleAction}>
          {config.actionLabel}
          <ArrowRight size={14} className="ml-1.5" />
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

