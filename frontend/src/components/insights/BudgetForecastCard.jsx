import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useFinancial } from '../../context/FinancialContext';

export const BudgetForecastCard = ({ forecast }) => {
  const { formatCurrency } = useFinancial();
  const percentSpent = Math.min(100, Math.round((forecast.spent / forecast.budget) * 100));
  const percentPredicted = Math.min(100, Math.round((forecast.predicted / forecast.budget) * 100));

  const isOver = forecast.spent > forecast.budget;
  const isNear = percentSpent >= 85 && !isOver;

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
            style={{ backgroundColor: forecast.color }}
          >
            {forecast.category.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-main)]">
              {forecast.category}
            </h4>
            <span className="text-xs text-[var(--text-muted)]">Budget Limit: {formatCurrency(forecast.budget)}</span>
          </div>
        </div>

        {isOver ? (
          <Badge variant="expense" icon={AlertTriangle}>
            Over Budget
          </Badge>
        ) : isNear ? (
          <Badge variant="warning" icon={AlertTriangle}>
            Near Limit
          </Badge>
        ) : (
          <Badge variant="success" icon={CheckCircle}>
            On Track
          </Badge>
        )}
      </div>

      {/* Figures */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-base)]">
        <div>
          <span className="text-[var(--text-muted)] block text-[11px]">Spent so far:</span>
          <span className="font-semibold text-xs sm:text-sm text-[var(--text-main)] tabular-nums">
            {formatCurrency(forecast.spent)}
          </span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] block text-[11px]">Estimate (not AI prediction):</span>
          <span className={`font-semibold text-xs sm:text-sm tabular-nums ${forecast.predicted > forecast.budget ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-main)]'}`}>
            {formatCurrency(forecast.predicted)}
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-muted)]">Spent: {percentSpent}%</span>
          <span className="text-[var(--text-muted)]">Estimate (not AI prediction): {percentPredicted}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-base)]">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentSpent}%` }}
          />
        </div>
      </div>
    </Card>
  );
};
