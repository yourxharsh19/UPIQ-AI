import { ShieldCheck, Info } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const Admin = () => (
  <div className="space-y-6">
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-main)]">Administrator Console</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Administrative monitoring and live telemetry are Coming soon.</p>
      </div>
      <Badge variant="warning">Coming soon</Badge>
    </header>
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <Info className="text-amber-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-[var(--text-main)]">Live admin telemetry — Coming soon</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        This project does not currently provide admin APIs for platform user counts, fraud monitoring, model accuracy,
        inference latency, service-region status, or model retraining. Live admin telemetry will be enabled once backend admin endpoints are deployed.
      </p>
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <ShieldCheck size={16} aria-hidden="true" />
        Authentication and protected user data remain handled by the existing backend.
      </div>
    </Card>
  </div>
);
