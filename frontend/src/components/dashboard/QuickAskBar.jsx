import React, { useState } from 'react';
import { ArrowRight, Bot } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Button } from '../common/Button';

export const QuickAskBar = () => {
  const [query, setQuery] = useState('');
  const { triggerAiQuery } = useFinancial();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      triggerAiQuery(query);
      setQuery('');
    }
  };

  const samplePills = [
    "Am I on track for my September budget?",
    "Summarize this week's dining expenses",
    "Show irregular subscriptions",
  ];

  return (
    <section aria-labelledby="quick-ask-heading" className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <h3 id="quick-ask-heading" className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
            Financial Assistant Quick Query
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Ask about your ledger cash flow, category budgets, or top expenses
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your finances... (e.g., 'What was my largest expense?')"
            aria-label="Ask UPIQ AI a financial question"
            className="w-full rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>
        <Button type="submit" variant="primary" size="md" icon={ArrowRight} className="shrink-0">
          Ask
        </Button>
      </form>

      {/* Suggested quick pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1">Suggestions:</span>
        {samplePills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => triggerAiQuery(pill)}
            className="px-2.5 py-1 text-[11px] rounded-md border border-[var(--border-base)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
          >
            {pill}
          </button>
        ))}
      </div>
    </section>
  );
};
