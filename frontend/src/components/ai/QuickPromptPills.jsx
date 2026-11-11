import React from 'react';
import { Sparkles } from 'lucide-react';
import { getFinancialChatPrompts } from '../../utils/financialChatPrompts.js';

export const QuickPromptPills = ({ onSelectPrompt, transactions = [] }) => {
  const prompts = getFinancialChatPrompts(transactions);

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((p) => (
        <button
          key={p}
          onClick={() => onSelectPrompt(p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-base)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] text-[var(--text-main)] hover:border-blue-500/40 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
          {p}
        </button>
      ))}
    </div>
  );
};
