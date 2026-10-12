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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium glass-pill text-indigo-200 hover:text-white hover:border-indigo-400 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          {p}
        </button>
      ))}
    </div>
  );
};
