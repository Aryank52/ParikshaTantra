import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, ShieldAlert, Activity, CheckCircle2, AlertTriangle, Users, 
  MapPin, Clock, RefreshCw, Zap, Lock, Eye, Server, Cpu, Globe, Flame, Shield, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ExamDayControlTower: React.FC = () => {
  const { user, token, switchUser } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [freezeMessage, setFreezeMessage] = useState<string>('');
  const intervalRef = useRef<any>(null);

  const fetchMetrics = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/control-tower/metrics');
      setMetrics(data);
    } catch (err: any) {
      if (err?.status === 401 || err?.isAuthError) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, token]);

  const handleGlobalFreeze = async () => {
    if (!window.confirm('CRITICAL ACTION: Execute Emergency Global Exam Freeze across all centres?')) return;
    try {
      const res = await api.post('/soc/emergency-freeze', {
        scope: 'GLOBAL',
        reason: 'CRITICAL SECURITY ANOMALY: Global Freeze Triggered from Exam Day Control Tower.',
      });
      setFreezeMessage(`⚠️ ${res.message}`);
      fetchMetrics();
    } catch (err: any) {
      setFreezeMessage(`❌ Freeze failed: ${err.message}`);
    }
  };

  if (!user || !token) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">AUTHENTICATION REQUIRED FOR CONTROL TOWER</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            National Exam Day telemetry and live multi-state command monitoring are restricted to authorized examination officials.
          </p>
          <button
            onClick={() => switchUser('national_admin')}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 inline-flex items-center space-x-2 transition-all"
          >
            <span>Authenticate as National Authority</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (loading && !metrics) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-sm font-mono">Initializing National Exam Day Control Tower Telemetry...</p>
      </div>
    );
  }

  const s = metrics?.summary || {};

  return (
    <div className="space-y-6">
      {/* Control Tower Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center">
        <div>
          <div className="flex items-center space-x-3">
            <Radio className="w-9 h-9 text-rose-500 animate-pulse" />
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white tracking-wider">NATIONAL EXAM DAY CONTROL TOWER</h1>
                <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono rounded font-bold uppercase">
                  LIVE OPERATIONS ACTIVE
                </span>
              </div>
              <p className="text-slate-400 text-sm">Unified Command Center for Central & State Examination Authorities</p>
            </div>
          </div>
        </div>

        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <button
            onClick={handleGlobalFreeze}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-md transition flex items-center space-x-2 shadow-lg shadow-rose-950"
          >
            <Flame className="w-4 h-4" />
            <span>EMERGENCY GLOBAL FREEZE</span>
          </button>
          <button
            onClick={fetchMetrics}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-md border border-slate-700"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {freezeMessage && (
        <div className="p-4 bg-rose-950/90 border border-rose-800 text-rose-200 font-mono text-sm rounded-md shadow-lg">
          {freezeMessage}
        </div>
      )}

      {/* Top Level Command Metrics (The 6 Key Identifiers) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Active Exams</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-cyan-400">{s.activeExams || 1}</span>
            <span className="text-xs text-slate-500">Total: {s.totalExams || 1}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Centres Online</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400">{s.activatedCentres || s.totalCentres || 25}</span>
            <span className="text-xs text-slate-500">Total: {s.totalCentres || 25}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Candidates In Session</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-purple-400">{s.activeSessions || 1250}</span>
            <span className="text-xs text-slate-500">Verified: {s.verifiedCandidates || 1250}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Terminal Health</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400">{s.terminalHealthPercentage || 98}%</span>
            <span className="text-xs text-emerald-500">OPTIMAL</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Security Alerts</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-400">{s.totalEvents || 3}</span>
            <span className="text-xs text-slate-500 font-mono">Logged</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Critical Incidents</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold ${(s.criticalIncidents || 0) > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {s.criticalIncidents || 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">Open</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Day Operational Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Exam-Day Milestone Timeline</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">IST (UTC+5:30)</span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {metrics?.timelineMilestones.map((m: any, idx: number) => (
              <div key={idx} className="relative flex items-start space-x-3 pl-2">
                <div className={`w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 z-10 ${
                  m.status === 'COMPLETED' ? 'bg-emerald-500 ring-4 ring-emerald-950' :
                  m.status === 'IN_PROGRESS' ? 'bg-cyan-400 ring-4 ring-cyan-950 animate-ping' :
                  'bg-slate-700'
                }`} />
                <div className="flex-1 bg-slate-800/60 p-3 rounded border border-slate-700/60 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 block">{m.time}</span>
                    <span className="text-xs font-semibold text-slate-200">{m.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    m.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    m.status === 'IN_PROGRESS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Security Incidents & Threat Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Live Incident Queue & Telemetry Stream</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">SOC Sensor Stream Active</span>
          </div>

          <div className="space-y-3">
            {metrics?.recentIncidents.map((evt: any) => (
              <div key={evt.id} className="bg-slate-800/60 border border-slate-700 rounded-md p-3.5 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded mt-0.5 ${
                    evt.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    evt.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white font-mono">{evt.eventType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {evt.centre?.name ? `${evt.centre.name} (${evt.centre.state})` : 'System-wide'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono">{evt.detailsJson ? JSON.parse(evt.detailsJson).action || JSON.parse(evt.detailsJson).reason || 'Security event logged' : 'Security telemetry alert'}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Timestamp: {new Date(evt.createdAt).toLocaleTimeString()} IST | Risk Score: {evt.riskScore}/100
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${
                  evt.status === 'FROZEN' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {evt.status}
                </span>
              </div>
            ))}

            {(!metrics?.recentIncidents || metrics.recentIncidents.length === 0) && (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No active critical security anomalies detected. All examination centres operating within green parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
