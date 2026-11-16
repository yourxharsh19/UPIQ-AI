import StatCard from "./StatCard";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatInrAmount } from "../../utils/financialDisplay";
import { calculateBalance, calculateTotalExpenses, calculateTotalIncome } from "../../utils/transactionUtils.js";

const OverviewCards = ({ transactions }) => {
    // Calculate totals
    // Calculate totals
    const totalIncome = calculateTotalIncome(transactions);
    const totalExpense = calculateTotalExpenses(transactions);
    const balance = calculateBalance(transactions);

    const stats = [
        {
            title: "Total Balance",
            value: formatInrAmount(balance),
            icon: Wallet,
            color: "bg-blue-500"
        },
        {
            title: "Total Income",
            value: formatInrAmount(totalIncome),
            icon: TrendingUp,
            color: "bg-green-500"
        },
        {
            title: "Total Spend",
            value: formatInrAmount(totalExpense),
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
