import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Receipt,
  BrainCircuit,
  FileText,
  Download,
  Bot,
  Globe,
  FileSpreadsheet,
  ShieldAlert,
  TrendingUp,
  Cloud,
  Mic,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { BACKEND_FEATURES, checkBackendHealth } from '../../services/backendFeatureStatus';

const ICON_MAP = {
  ShieldCheck,
  Receipt,
  BrainCircuit,
  FileText,
  Download,
  Bot,
  Globe,
  FileSpreadsheet,
  ShieldAlert,
  TrendingUp,
  Cloud,
  Mic,
  Bell,
};

export const BackendFeatureRoadmapModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'online' | 'upcoming'
  const [backendHealth, setBackendHealth] = useState({ loading: true, connected: false });

  useEffect(() => {
    if (isOpen) {
      checkBackendHealth().then((res) => {
        setBackendHealth({ loading: false, connected: res.connected });
      });
    }
  }, [isOpen]);

  const onlineCount = BACKEND_FEATURES.filter((f) => f.status === 'ONLINE').length;
  const upcomingCount = BACKEND_FEATURES.filter((f) => f.status === 'COMING_SOON').length;

  const filteredFeatures = BACKEND_FEATURES.filter((f) => {
    if (activeTab === 'online') return f.status === 'ONLINE';
    if (activeTab === 'upcoming') return f.status === 'COMING_SOON';
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Backend Capabilities & System Roadmap" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Connection Status Banner */}
        <div className="p-4 rounded-2xl glass-panel border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${backendHealth.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <Server className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100 light:text-slate-900">
                  Backend API Engine Status
                </h4>
                <Badge variant={backendHealth.connected ? 'success' : 'warning'} size="sm">
                  {backendHealth.loading ? 'Checking...' : backendHealth.connected ? 'Spring Boot Active (Port 8080)' : 'Client Local Engine Active'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time feature verification between client interface and backend endpoints
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-bold">{onlineCount} Active</span>
            <span className="text-slate-600">/</span>
            <span className="text-purple-400 font-bold">{upcomingCount} Upcoming</span>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-800 light:border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-400 light:text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All System Features ({BACKEND_FEATURES.length})
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'online'
                ? 'border-emerald-500 text-emerald-400 light:text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Available Now ({onlineCount})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'border-purple-500 text-purple-400 light:text-purple-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Phase 2 Upcoming ({upcomingCount})
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeatures.map((feat) => {
            const IconComponent = ICON_MAP[feat.icon] || Sparkles;
            const isOnline = feat.status === 'ONLINE';

            return (
              <div
                key={feat.id}
                className={`p-4 rounded-2xl glass-panel border transition-all duration-200 ${
                  isOnline
                    ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-slate-900/40'
                    : 'border-purple-500/20 hover:border-purple-500/40 bg-purple-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100 light:text-slate-900">
                        {feat.name}
                      </h5>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {feat.category}
                      </span>
                    </div>
                  </div>
                  <Badge variant={isOnline ? 'success' : 'ai'} size="sm">
                    {feat.badgeText}
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 light:text-slate-700 mt-3 leading-relaxed">
                  {feat.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 light:border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Endpoint / Contract:</span>
                  <span className={isOnline ? 'text-emerald-400' : 'text-purple-300'}>
                    {feat.endpoint}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
