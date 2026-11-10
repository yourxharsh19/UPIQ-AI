import clsx from "clsx";

const Card = ({ children, className }) => {
    return (
        <div className={clsx(
            "bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl shadow-xs overflow-hidden transition-colors",
            className
        )}>
            {children}
        </div>
    );
};

export default Card;
