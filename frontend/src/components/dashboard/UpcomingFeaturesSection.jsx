import React, { useState } from 'react';
import { Sparkles, Clock, CheckCircle2, ChevronRight, Server, ArrowRight, ShieldCheck, FileSpreadsheet, Mic, Cloud, ShieldAlert, TrendingUp } from 'lucide-react';
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
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </span>
              <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
                UPIQ System Roadmap & Feature Matrix
              </h3>
              <Badge variant="ai" size="sm">
                Backend Status Verified
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active microservices: <span className="text-emerald-400 font-bold">{onlineCount} Endpoints Online</span> • Phase 2 Upgrades in Progress
            </p>
          </div>

          <Button onClick={() => setIsRoadmapOpen(true)} variant="secondary" size="sm" icon={Server}>
            View Full System Matrix
          </Button>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingFeatures.slice(0, 3).map((feat) => (
            <div
              key={feat.id}
              className="p-5 rounded-2xl glass-panel border border-purple-500/20 bg-gradient-to-b from-purple-950/20 via-slate-900/40 to-slate-950/60 hover:border-purple-500/40 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {feat.badgeText}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Phase 2
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 group-hover:text-purple-300 transition-colors">
                {feat.name}
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {feat.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Target availability:</span>
                <span className="text-purple-400 font-semibold flex items-center gap-1">
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
