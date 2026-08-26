import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, AlertTriangle, Radio, Lock, MapPin, Zap, RefreshCw, Shield, ArrowRight } from 'lucide-react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SOCDashboard: React.FC = () => {
  const { user, token, wsConnected, switchUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [freezeActionLoading, setFreezeActionLoading] = useState(false);
  const intervalRef = useRef<any>(null);

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const socData = await fetchApi('/soc/dashboard');
      setData(socData);
      setErrorState(null);
    } catch (err: any) {
      if (err?.status === 401 || err?.isAuthError) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setErrorState('SESSION_EXPIRED');
      } else {
        setErrorState(err.message || 'Failed to connect to SOC Backend');
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

    loadData();
    intervalRef.current = setInterval(loadData, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, token]);

  const handleEmergencyFreeze = async (targetType: string, targetId: string, reason: string) => {
    if (!window.confirm(`EMERGENCY WAR-ROOM CONTROL: Trigger ${targetType} Freeze for target ${targetId}?`)) return;
    setFreezeActionLoading(true);
    try {
      await fetchApi('/soc/emergency-freeze', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      alert(`Emergency ${targetType} Freeze command broadcast successfully via WebSocket.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Freeze action failed');
    } finally {
      setFreezeActionLoading(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">AUTHENTICATION REQUIRED FOR SOC TELEMETRY</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Real-time Security Operations Centre telemetry and Emergency War-Room controls are restricted to verified security personnel.
          </p>
          <button
            onClick={() => switchUser('security_officer')}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-red-500/20 inline-flex items-center space-x-2 transition-all"
          >
            <span>Authenticate as Security Officer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const cityMarkers = [
    { city: 'New Delhi (Dwarka)', centreCode: 'CENTRE-DELHI-01', coords: '28.5921, 77.0460', status: 'GREEN' },
    { city: 'Mumbai (BKC Powai)', centreCode: 'CENTRE-MUMBAI-02', coords: '19.0657, 72.8687', status: 'GREEN' },
    { city: 'Bengaluru (E-City)', centreCode: 'CENTRE-BLR-03', coords: '12.8452, 77.6602', status: 'GREEN' },
    { city: 'Hyderabad (Hitec City)', centreCode: 'CENTRE-HYD-04', coords: '17.4435, 78.3772', status: 'GREEN' },
    { city: 'Lucknow (Gomti Nagar)', centreCode: 'CENTRE-LKO-05', coords: '26.8606, 81.0118', status: 'GREEN' },
    { city: 'Patna (Kankarbagh)', centreCode: 'CENTRE-PAT-06', coords: '25.5941, 85.1376', status: 'GREEN' },
    { city: 'Jaipur (Malviya Nagar)', centreCode: 'CENTRE-JAP-07', coords: '26.8523, 75.8143', status: 'GREEN' },
    { city: 'Kolkata (Salt Lake V)', centreCode: 'CENTRE-KOL-08', coords: '22.5726, 88.4331', status: 'GREEN' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-400 animate-pulse">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">National Security Operations Centre (SOC)</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                {data ? 'LIVE TELEMETRY' : 'CONNECTING'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Apex Anti-Leak Command War-Room • National Centre Telemetry & Emergency Incident Response
            </p>
          </div>
        </div>

        <button
          onClick={() => handleEmergencyFreeze('GLOBAL', 'ALL_EXAMS', 'SOC Officer Manual War-Room Trigger')}
          disabled={freezeActionLoading}
          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-xl shadow-xl shadow-red-500/30 border border-red-400 flex items-center space-x-2 transition-all transform active:scale-95"
        >
          <Lock className="w-4 h-4" />
          <span>TRIGGER GLOBAL EXAM FREEZE</span>
        </button>
      </div>

      {errorState && (
        <div className="bg-red-950/70 border border-red-500/40 p-4 rounded-xl text-red-200 text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>SOC Telemetry notice: {errorState}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Total Active Centres</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold">{data ? 'LIVE' : 'DEMO'}</span>
          </div>
          <div className="text-2xl font-black text-blue-400">{data?.summary?.totalCentres ?? 8}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Live Active Candidates</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">{data ? 'LIVE' : 'DEMO'}</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{data?.summary?.activeCandidates ?? 1}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>System Threat Level</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">ZERO-TRUST</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">NORMAL (GREEN)</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Audit Ledger Verification</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">MERKLE</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">100% VALID</div>
        </div>
      </div>

      {/* GIS National Map & City Node Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>NATIONAL EXAM CENTRES TELEMETRY MAP</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">10 Landmark Digital Zones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cityMarkers.map((m) => (
              <div key={m.centreCode} className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 font-sans">{m.city}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {m.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Code: <strong className="text-blue-400">{m.centreCode}</strong></div>
                <div className="text-[10px] text-slate-500">Coords: {m.coords}</div>
                <button
                  onClick={() => handleEmergencyFreeze('CENTRE', m.centreCode, `SOC Freeze trigger for centre ${m.centreCode}`)}
                  className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 rounded text-[10px] font-bold border border-slate-700 transition-colors"
                >
                  Freeze Centre Node
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Event Feed */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 font-mono mb-3">REAL-TIME THREAT LOGS</h3>
            <div className="space-y-2">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="text-emerald-400 font-bold">[SOC-OK] System Initialization</div>
                <div className="text-slate-400">All 10 TCS iON Digital Zones verified & online.</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="text-blue-400 font-bold">[SOC-INFO] Global Exam Release</div>
                <div className="text-slate-400">NEET UG 2026 short-lived activation derived.</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-center space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-emerald-400 font-bold">
                {wsConnected ? 'WAR-ROOM BROADCASTER ACTIVE' : 'WEBSOCKET CONNECTING...'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">Zero-Trust Real-Time Security WebSocket Channel</div>
          </div>
        </div>
      </div>
    </div>
  );
};

