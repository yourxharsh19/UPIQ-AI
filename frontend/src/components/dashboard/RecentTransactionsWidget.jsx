import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useFinancial } from '../../context/FinancialContext';

export const RecentTransactionsWidget = () => {
  const { transactions, setActiveTab, formatCurrency, openStatementModal } = useFinancial();
  const recent = transactions.slice(0, 6);

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
            Recent Ledger Activity
          </h3>
          <p className="text-xs text-[var(--text-muted)]">Latest transactions recorded in your account</p>
        </div>
        <button
          onClick={() => setActiveTab('transactions')}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          View All Transactions &rarr;
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center space-y-2.5">
          <p className="text-xs text-[var(--text-muted)] font-medium">No transactions recorded in your ledger yet.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={openStatementModal}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors cursor-pointer"
            >
              Upload Statement
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-card)] font-medium transition-colors cursor-pointer"
            >
              Go to Ledger
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-base)] text-[var(--text-muted)] font-medium">
                <th className="pb-2.5 pl-1">Description</th>
                <th className="pb-2.5">Mode</th>
                <th className="pb-2.5">Category</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right pr-1">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-base)]">
              {recent.map((tx) => (
                <tr key={tx.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="py-2.5 pl-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[var(--text-main)] block truncate max-w-[180px]">
                          {tx.title}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">{tx.merchant}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-base)] font-mono text-[10px]">
                      {tx.mode}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[var(--text-muted)]">{tx.category}</span>
                  </td>
                  <td className="py-2.5">
                    <Badge variant="neutral">Not monitored</Badge>
                  </td>
                  <td className="py-2.5 text-right pr-1 font-semibold tabular-nums">
                    <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
