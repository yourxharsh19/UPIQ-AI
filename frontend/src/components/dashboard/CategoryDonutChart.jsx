import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card } from '../common/Card';
import { useFinancial } from '../../context/FinancialContext';

export const CategoryDonutChart = () => {
  const { categories, formatCurrency } = useFinancial();

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 light:bg-white light:border-slate-300">
          <p className="font-bold text-slate-100 light:text-slate-900">{data.name}</p>
          <p className="text-indigo-400 font-semibold">
            {formatCurrency(data.value)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-100 light:text-slate-900">
          Spending mix
        </h3>
        <p className="text-xs text-slate-400">Where your monthly spend is going</p>
      </div>

      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Summary text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Total Spent</span>
          <span className="text-base font-extrabold text-slate-100 light:text-slate-900">
            {formatCurrency(categories.reduce((acc, c) => acc + c.value, 0))}
          </span>
        </div>
      </div>

      {/* Category legend grid */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/80 light:border-slate-200">
        {categories.slice(0, 6).map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/40">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-300 light:text-slate-700 truncate">{cat.name}</span>
            </div>
            <span className="font-semibold text-slate-200 light:text-slate-900 ml-2">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
