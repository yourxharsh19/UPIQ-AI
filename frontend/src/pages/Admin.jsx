import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Brain,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Server,
  RefreshCw,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const Admin = () => {
  const { adminMetrics, addToast, formatCurrency } = useFinancial();
  const [activeTab, setActiveTab] = useState('flagged');

  const handleRetrainModel = () => {
    addToast('ML Model Pipeline Triggered', 'Initiated online fine-tuning on 142k transaction records', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 light:text-slate-900 flex items-center gap-2">
            System Administrator Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Platform risk monitoring, user active metrics, and ML classification health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            System Status: 100% Operational
          </Badge>
        </div>
      </div>

      {/* Top System Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Active Platform Users</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-100 light:text-slate-900 mt-3">
            {adminMetrics.activeUsers.toLocaleString()}
          </h3>
          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">
            {adminMetrics.userGrowth}
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Processed Volume</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-100 light:text-slate-900 mt-3">
            {formatCurrency(adminMetrics.totalVolume)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Total throughput</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Anomalies Detected</span>
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-amber-400 mt-3">
            {adminMetrics.anomaliesDetectedToday}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Last 24 hours</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Categorization Accuracy</span>
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-purple-300 mt-3">
            {adminMetrics.mlHealth.categorizationAccuracy}
          </h3>
          <span className="text-[11px] text-emerald-400 font-bold mt-1 block">Optimal Precision</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 light:border-slate-200">
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'flagged'
              ? 'border-indigo-500 text-indigo-400 light:text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Flagged Transactions Matrix ({adminMetrics.systemRiskAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('ml-health')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'ml-health'
              ? 'border-indigo-500 text-indigo-400 light:text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ML Engine Health & Metrics
        </button>
      </div>

      {/* Tab 1: Flagged Transactions Matrix */}
      {activeTab === 'flagged' && (
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
            High-Risk System Flagged Transactions Queue
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 light:border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Alert ID</th>
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Flag Type</th>
                  <th className="pb-3">Risk Score</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                {adminMetrics.systemRiskAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono text-slate-400">{alert.id}</td>
                    <td className="py-3 font-semibold text-slate-200">{alert.user}</td>
                    <td className="py-3 text-slate-300">{alert.type}</td>
                    <td className="py-3">
                      <Badge variant="fraud">{alert.risk}% Risk</Badge>
                    </td>
                    <td className="py-3 font-bold text-rose-400">{alert.amount}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="secondary" size="sm">
                        Inspect Telemetry
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: ML Engine Health */}
      {activeTab === 'ml-health' && (
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
                    UPIQ Machine Learning Pipeline Telemetry
                  </h3>
                  <p className="text-xs text-slate-400">Model: UPIQ-Transformer-v4.2 (Zero-shot NLP + Fraud GNN)</p>
                </div>
              </div>

              <Button onClick={handleRetrainModel} variant="ai" icon={RefreshCw}>
                Trigger Retrain
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Categorization Accuracy</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                  {adminMetrics.mlHealth.categorizationAccuracy}
                </span>
                <span className="text-[10px] text-slate-500">Target: &gt;98.0%</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Fraud Recall Rate</span>
                <span className="text-2xl font-extrabold text-purple-400 mt-1 block">
                  {adminMetrics.mlHealth.fraudRecallRate}
                </span>
                <span className="text-[10px] text-slate-500">Target: &gt;99.0%</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Avg Inference Latency</span>
                <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
                  {adminMetrics.mlHealth.avgInferenceLatency}
                </span>
                <span className="text-[10px] text-slate-500">Sub-50ms guarantee</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono">
              <p className="text-emerald-400">&gt; Status: All inference microservices online (us-east-1, eu-central-1)</p>
              <p className="text-slate-400">&gt; Last Training Sync: {adminMetrics.mlHealth.lastTrained}</p>
              <p className="text-indigo-400">&gt; Embeddings Cache Hit Ratio: 99.4%</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
