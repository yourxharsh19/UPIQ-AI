import StatCard from "./StatCard";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatInrAmount } from "../../utils/financialDisplay";

const OverviewCards = ({ transactions }) => {
    // Calculate totals
    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type && t.type.toLowerCase() === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type && t.type.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const stats = [
        {
            title: "Total Balance",
            amount: formatInrAmount(balance),
            icon: Wallet,
            color: "bg-blue-500"
        },
        {
            title: "Total Income",
            amount: formatInrAmount(totalIncome),
            icon: TrendingUp,
            color: "bg-green-500"
        },
        {
            title: "Total Spend",
            amount: formatInrAmount(totalExpense),
            icon: TrendingDown,
            color: "bg-red-500"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
};

export default OverviewCards;
