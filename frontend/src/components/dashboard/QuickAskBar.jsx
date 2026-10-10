import React, { useState } from 'react';
import { Sparkles, ArrowRight, Mic } from 'lucide-react';
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
    <section aria-labelledby="quick-ask-heading" className="relative overflow-hidden rounded-[26px] border border-indigo-400/15 bg-gradient-to-br from-[#171729]/95 via-[#12131b]/90 to-[#10131a]/85 p-5 sm:p-6 glass-panel-glow space-y-5">
      <div aria-hidden="true" className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-[75px]" />
      <div className="relative flex items-center gap-3">
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-indigo-300 shadow-[0_8px_30px_-16px_rgba(129,140,248,0.8)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 id="quick-ask-heading" className="text-base font-semibold tracking-tight text-slate-100 light:text-slate-900">
            Ask your money anything
          </h3>
          <p className="text-xs text-indigo-200/80">
            Natural language analysis across your entire cash flow, debts, and budgets
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question... (e.g., 'How much idle cash do I have?')"
            aria-label="Ask UPIQ AI a financial question"
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <Button type="submit" variant="ai" icon={ArrowRight} className="shrink-0 active:scale-[0.97]">
          Ask AI
        </Button>
      </form>

      {/* Suggested quick pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-slate-400 font-medium">Quick prompts:</span>
        {samplePills.map((pill) => (
          <button
            key={pill}
            onClick={() => triggerAiQuery(pill)}
            className="px-3 py-1.5 text-[11px] rounded-full glass-pill text-indigo-100/80 hover:text-white hover:border-indigo-400/50 hover:bg-indigo-400/10 transition-all duration-200 active:scale-95"
          >
            {pill}
          </button>
        ))}
      </div>
    </section>
  );
};
