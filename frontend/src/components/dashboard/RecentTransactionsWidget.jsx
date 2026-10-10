import React from 'react';
import { AlertTriangle, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useFinancial } from '../../context/FinancialContext';

export const RecentTransactionsWidget = () => {
  const { transactions, setActiveTab, setIsFraudDrawerOpen, formatCurrency } = useFinancial();
  const recent = transactions.slice(0, 6);

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-100 light:text-slate-900">
            Recent activity
          </h3>
          <p className="text-xs text-slate-400">Live ledger stream with automated anomaly detection</p>
        </div>
        <button
          onClick={() => setActiveTab('transactions')}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-400/10 hover:text-indigo-200 light:text-indigo-600"
        >
          View All Ledger &rarr;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 light:border-slate-200 text-slate-400 uppercase font-semibold">
              <th className="pb-3 pl-2">Transaction</th>
              <th className="pb-3">Mode</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">AI Anomaly Status</th>
              <th className="pb-3 text-right pr-2">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
            {recent.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors">
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-100 light:text-slate-900 block truncate max-w-[150px]">
                        {tx.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{tx.merchant}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 light:bg-slate-200 light:text-slate-800 font-mono text-[10px]">
                    {tx.mode}
                  </span>
                </td>
                <td className="py-3">
                  <span className="text-slate-300 light:text-slate-700">{tx.category}</span>
                </td>
                <td className="py-3">
                  {tx.isFraud ? (
                    <button
                      onClick={() => setIsFraudDrawerOpen(true)}
                      className="cursor-pointer"
                    >
                      <Badge variant="fraud">HIGH RISK FRAUD</Badge>
                    </button>
                  ) : tx.isAnomaly ? (
                    <Badge variant="anomaly">Unusual Spend</Badge>
                  ) : (
                    <Badge variant="success">Normal</Badge>
                  )}
                </td>
                <td className="py-3 text-right pr-2 font-bold">
                  <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100 light:text-slate-900'}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
