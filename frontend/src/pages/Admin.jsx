import { ShieldCheck, Info } from 'lucide-react';
import { Card } from '../components/common/Card';

export const Admin = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-extrabold text-[var(--text-main)]">Administrator Console</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Administrative monitoring is not connected to backend data.</p>
    </header>
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <Info className="text-amber-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-[var(--text-main)]">Live admin telemetry unavailable</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        This project does not currently provide admin APIs for platform user counts, fraud monitoring, model accuracy,
        inference latency, service-region status, or model retraining. No live values or operational guarantees are shown here.
      </p>
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <ShieldCheck size={16} aria-hidden="true" />
        Authentication and protected user data remain handled by the existing backend.
      </div>
    </Card>
  </div>
);
