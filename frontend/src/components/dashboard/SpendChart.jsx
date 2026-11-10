import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const SpendChart = ({ transactions }) => {
    // Group transactions by month (simplified for now) or category
    // For this example, let's show Category-wise spend
    const categoryData = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            const category = t.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {});

    const data = Object.keys(categoryData).map(key => ({
        name: key,
        amount: categoryData[key]
    }));

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100 h-80 flex items-center justify-center text-gray-400">
                No expense data to display
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-base)] h-80 shadow-sm">
            <h3 className="text-[var(--text-main)] text-sm font-semibold mb-6 tracking-tight">Category Spend</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-base)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--bg-surface)', opacity: 0.4 }}
                        contentStyle={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-base)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Bar dataKey="amount" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SpendChart;
