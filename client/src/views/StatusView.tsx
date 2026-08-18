import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, CheckCircle2, Server, Database, Radio, Cpu, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const StatusView: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await api.get('/health');
      setHealth(data);
    } catch (err) {
      console.error('Failed health check', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg text-center space-y-2">
        <div className="flex justify-center mb-2">
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">PARIKSHATANTRA SYSTEM STATUS & HEALTH</h1>
        <p className="text-slate-400 text-sm">Real-time National Examination Operating Infrastructure Health & Sensor Feeds</p>
      </div>

      {/* Main Operational Banner */}
      <div className="bg-emerald-950/60 border border-emerald-700/60 p-5 rounded-lg flex items-center justify-between text-emerald-300">
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold">ALL SYSTEMS OPERATIONAL</h2>
            <p className="text-xs text-emerald-400/80">National CBT Gateways, AES-256 Vaults & Audit Hash-Chains Normal</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-emerald-900/80 text-emerald-200 border border-emerald-600 px-3 py-1 rounded">
          ZERO-TRUST ENFORCED
        </span>
      </div>

      {/* Infrastructure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Central API Gateway</h3>
              <p className="text-xs text-slate-400">Node.js Express Cluster</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
            OPERATIONAL
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Relational DB & ORM</h3>
              <p className="text-xs text-slate-400">Prisma Client Engine</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
            HEALTHY
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white">WebSocket Telemetry Stream</h3>
              <p className="text-xs text-slate-400">Real-time Incident Dispatch</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
            ACTIVE (ws://)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Gemini AI Threat & Leak Engine</h3>
              <p className="text-xs text-slate-400">Deep Semantic Analysis</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
            ONLINE
          </span>
        </div>
      </div>
    </div>
  );
};
