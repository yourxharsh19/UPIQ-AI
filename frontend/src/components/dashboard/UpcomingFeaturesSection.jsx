import React, { useState } from 'react';
import { Clock, Server } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { BackendFeatureRoadmapModal } from '../common/BackendFeatureRoadmapModal';
import { BACKEND_FEATURES } from '../../services/backendFeatureStatus';

export const UpcomingFeaturesSection = () => {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  const upcomingFeatures = BACKEND_FEATURES.filter((f) => f.status === 'COMING_SOON');
  const onlineCount = BACKEND_FEATURES.filter((f) => f.status === 'ONLINE').length;

  return (
    <>
      <section className="space-y-3.5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
                Product Roadmap & Capabilities
              </h3>
              <Badge variant="info" size="sm">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Current services: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{onlineCount} Endpoints Online</span> • Phase 2 Upgrades in Progress
            </p>
          </div>

          <Button onClick={() => setIsRoadmapOpen(true)} variant="secondary" size="sm" icon={Server}>
            View Feature Roadmap
          </Button>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {upcomingFeatures.slice(0, 3).map((feat) => (
            <div
              key={feat.id}
              className="p-4 rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] hover:border-slate-400 dark:hover:border-slate-700 transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {feat.badgeText}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  Phase 2
                </span>
              </div>

              <h4 className="text-xs font-semibold text-[var(--text-main)]">
                {feat.name}
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                {feat.description}
              </p>

              <div className="mt-3 pt-2.5 border-t border-[var(--border-base)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Target availability:</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Backend Feature Roadmap Modal */}
      <BackendFeatureRoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
    </>
  );
};
