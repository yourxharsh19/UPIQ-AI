import React from 'react';
import { Sparkles } from 'lucide-react';

export const QuickPromptPills = ({ onSelectPrompt }) => {
  const prompts = [
    "Summarize this week's expenses",
    "Am I on track for my budget?",
    "Show irregular spending & anomalies",
    "How much idle cash can I invest?",
    "Compare August vs September dining spend",
  ];

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
