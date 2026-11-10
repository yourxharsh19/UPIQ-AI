import clsx from "clsx";
import { Loader2 } from "lucide-react";

const Button = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    className,
    disabled = false,
    loading = false,
    type = "button"
}) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs",
        secondary: "bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs border border-[var(--border-base)]",
        danger: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs",
        ghost: "hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]",
        outline: "bg-transparent border border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
    };

    const sizes = {
        sm: "px-2.5 py-1.5 text-xs font-medium",
        md: "px-3.5 py-2 text-xs font-medium",
        lg: "px-5 py-2.5 text-sm font-medium"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={clsx(
                "inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className
            )}
        >
            {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
