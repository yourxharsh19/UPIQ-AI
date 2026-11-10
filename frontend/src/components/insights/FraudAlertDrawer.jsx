import React from 'react';
import { ShieldAlert } from 'lucide-react';

/** Placeholder for a future security workflow; no fraud analysis is performed here. */
export const FraudAlertDrawer = () => (
  <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4" aria-labelledby="fraud-upcoming-title">
    <div className="flex items-center gap-2.5">
      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
      <div>
        <h2 id="fraud-upcoming-title" className="text-xs font-semibold text-[var(--text-main)]">Security and fraud monitoring — Coming soon</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">UPIQ does not currently detect fraud, monitor threats, or freeze transactions (Coming soon).</p>
      </div>
    </div>
  </section>
);
