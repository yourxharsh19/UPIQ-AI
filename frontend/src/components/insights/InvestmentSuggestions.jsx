import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../common/Card';

export const InvestmentSuggestions = () => (
  <Card className="space-y-2">
    <div className="flex items-center gap-2.5">
      <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-[var(--text-main)]">Investment recommendations</h3>
    </div>
    <p className="text-xs text-[var(--text-muted)]">
      UPIQ does not currently provide personalized investment advice or execute allocations.
    </p>
  </Card>
);
