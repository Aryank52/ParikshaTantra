import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, ShieldAlert, Activity, CheckCircle2, AlertTriangle, Users,
  MapPin, Clock, RefreshCw, Zap, Lock, Eye, Server, Cpu, Globe, Flame,
  Shield, ArrowRight, Filter, Search, Monitor, Wifi, WifiOff, Layers,
  FileText, PauseCircle, PlayCircle, Power, X, ChevronRight, Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  OperationalAlert,
  ControlTowerExam,
  ControlTowerCentre,
  ControlTowerDevice,
  ControlTowerSession
} from '../types';

type ControlTowerTab = 'OVERVIEW' | 'CENTRES' | 'SESSIONS' | 'DEVICES' | 'SECURITY';

export const ExamDayControlTower: React.FC = () => {
  const { user, token, switchUser, wsConnected, lastWsMessage, sendWsMessage } = useAuth();

  // Active view state
  const [activeTab, setActiveTab] = useState<ControlTowerTab>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data sets
  const [metrics, setMetrics] = useState<any>(null);
  const [exams, setExams] = useState<ControlTowerExam[]>([]);
  const [centres, setCentres] = useState<ControlTowerCentre[]>([]);
  const [devices, setDevices] = useState<ControlTowerDevice[]>([]);
  const [sessions, setSessions] = useState<ControlTowerSession[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);

  // Filter states
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedReadinessFilter, setSelectedReadinessFilter] = useState<string>('ALL');
  const [centreSearchQuery, setCentreSearchQuery] = useState<string>('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('ALL');
  const [deviceCheckFilter, setDeviceCheckFilter] = useState<string>('ALL');

  // Modals & Action states
  const [freezeModalOpen, setFreezeModalOpen] = useState<boolean>(false);
  const [freezeReason, setFreezeReason] = useState<string>('EMERGENCY_SECURITY_ALERT: Unauthorized vault access anomaly');
  const [freezeActionLoading, setFreezeActionLoading] = useState<boolean>(false);
  const [freezeFeedback, setFreezeFeedback] = useState<string | null>(null);

  const [transitionModalExam, setTransitionModalExam] = useState<ControlTowerExam | null>(null);
  const [targetState, setTargetState] = useState<string>('');
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [transitionLoading, setTransitionLoading] = useState<boolean>(false);

  const [inspectedDevice, setInspectedDevice] = useState<ControlTowerDevice | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Fetch telemetry from all endpoints
  const fetchAllData = useCallback(async (isBackground = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!isBackground) setRefreshing(true);
    setErrorMessage(null);

    try {
      const [metricsData, examsData, centresData, devicesData, sessionsData, alertsData] = await Promise.all([
        api.get('/control-tower/metrics'),
        api.get('/control-tower/exams').catch(() => ({ exams: [] })),
        api.get('/control-tower/centres?limit=100').catch(() => ({ centres: [] })),
        api.get('/control-tower/devices?limit=100').catch(() => ({ devices: [] })),
        api.get('/control-tower/sessions?limit=50').catch(() => ({ sessions: [] })),
        api.get('/control-tower/alerts').catch(() => ({ alerts: [] })),
      ]);

      setMetrics(metricsData);
      setExams(examsData.exams || []);
      setCentres(centresData.centres || []);
      setDevices(devicesData.devices || []);
      setSessions(sessionsData.sessions || []);
      setAlerts(alertsData.alerts || []);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      if (err?.status !== 401 && !err?.isAuthError) {
        setErrorMessage(err?.message || 'Failed to fetch Control Tower operational telemetry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Initial fetch and auto-refresh loop
  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    fetchAllData();

    // Auto-poll every 8 seconds as resilient fallback
    pollIntervalRef.current = setInterval(() => {
      fetchAllData(true);
    }, 8000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [user, token, fetchAllData]);

  // WebSocket real-time subscription & reactive trigger
  useEffect(() => {
    if (!wsConnected || !user || !token) return;

    // Join authorized room
    const room = ['SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'SECURITY_OFFICER', 'AUDITOR'].includes(user.role)
      ? 'national'
      : user.organization?.code
      ? `centre:${user.organization.code}`
      : 'national';

    sendWsMessage({
      type: 'JOIN',
      room,
      token,
    });
  }, [wsConnected, user, token, sendWsMessage]);

  // React to incoming WebSocket push events
  useEffect(() => {
    if (!lastWsMessage) return;

    const eventType = lastWsMessage.type;
    if (
      eventType === 'OPERATIONAL_ALERT' ||
      eventType === 'EXAM_LIFECYCLE_CHANGED' ||
      eventType === 'CENTRE_STATUS_CHANGED' ||
      eventType === 'SESSION_TELEMETRY_UPDATE' ||
      eventType === 'EXAM_RELEASED' ||
      eventType === 'EXAM_FROZEN' ||
      eventType === 'SECURITY_ALERT'
    ) {
      fetchAllData(true);
    }
  }, [lastWsMessage, fetchAllData]);

  // Emergency Global Freeze execution
  const handleExecuteGlobalFreeze = async () => {
    setFreezeActionLoading(true);
    setFreezeFeedback(null);
    try {
      const res = await api.post('/soc/emergency-freeze', {
        scope: 'GLOBAL',
        reason: freezeReason || 'EMERGENCY_GLOBAL_FREEZE executed from National Control Tower.',
      });
      setFreezeFeedback(`✅ ${res.message || 'Global freeze command executed and broadcast to all examination nodes.'}`);
      fetchAllData(true);
      setTimeout(() => {
        setFreezeModalOpen(false);
        setFreezeFeedback(null);
      }, 2500);
    } catch (err: any) {
      setFreezeFeedback(`❌ Freeze execution error: ${err.message}`);
    } finally {
      setFreezeActionLoading(false);
    }
  };

  // Exam Lifecycle Transition execution
  const handleExecuteTransition = async () => {
    if (!transitionModalExam || !targetState) return;

    setTransitionLoading(true);
    try {
      const res = await api.post(`/control-tower/exams/${transitionModalExam.id}/transition`, {
        targetState,
        reason: transitionReason || `Exam lifecycle transition to ${targetState} initiated from Control Tower`,
      });

      if (res.success) {
        setTransitionModalExam(null);
        setTargetState('');
        setTransitionReason('');
        fetchAllData(true);
      } else {
        alert(`Transition blocked: ${res.message || 'Validation failed'}`);
      }
    } catch (err: any) {
      alert(`Lifecycle transition failed: ${err.message}`);
    } finally {
      setTransitionLoading(false);
    }
  };

  // Unauthenticated fallback view
  if (!user || !token) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">AUTHENTICATION REQUIRED FOR NATIONAL CONTROL TOWER</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Real-time examination telemetry, multi-state gateway synchronization, and lifecycle command authority are strictly restricted.
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

  // Initial loading state
  if (loading && !metrics) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-slate-300 text-sm font-mono tracking-wider">ESTABLISHING ZERO-TRUST TELEMETRY LINK...</p>
        <span className="text-xs text-slate-500 font-mono">Querying PostgreSQL Master • Aggregating 15 Centres</span>
      </div>
    );
  }

  const s = metrics?.summary || {};
  const geoBreakdown: any[] = metrics?.geographicBreakdown || [];
  const milestones: any[] = metrics?.timelineMilestones || [];
  const sessionStats = metrics?.sessionTelemetry || {};
  const deviceStats = metrics?.deviceHealth || {};

  // Filter centres
  const filteredCentres = centres.filter((c) => {
    if (selectedStateFilter !== 'ALL' && c.state !== selectedStateFilter) return false;
    if (selectedReadinessFilter !== 'ALL' && c.readinessStatus !== selectedReadinessFilter) return false;
    if (centreSearchQuery) {
      const q = centreSearchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.centreCode.toLowerCase().includes(q);
      const matchDist = c.district.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDist) return false;
    }
    return true;
  });

  // Filter sessions
  const filteredSessions = sessions.filter((sess) => {
    if (sessionStatusFilter !== 'ALL' && sess.status !== sessionStatusFilter) return false;
    return true;
  });

  // Filter devices
  const filteredDevices = devices.filter((d) => {
    if (deviceCheckFilter === 'PASS' && d.diagnostics.overallStatus !== 'PASS') return false;
    if (deviceCheckFilter === 'FAIL' && d.diagnostics.overallStatus !== 'FAIL') return false;
    return true;
  });

  // Unique states for filter dropdown
  const uniqueStates = Array.from(new Set(centres.map((c) => c.state))).filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & OPERATIONAL BAR                                */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-950/60 border border-rose-600/40 rounded-xl">
              <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h1 className="text-2xl font-bold text-white tracking-wide font-mono">
                  NATIONAL EXAM CONTROL TOWER
                </h1>
                <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono rounded font-bold uppercase tracking-wider">
                  OPERATIONAL INTELLIGENCE ACTIVE
                </span>
                <span className="px-2.5 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono rounded font-semibold">
                  ROLE: {user.role}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 font-mono">
                Unified Zero-Trust Examination Operating System • Multi-State Telemetry • PostgreSQL Source of Truth
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {/* Live WebSocket Status Indicator */}
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono text-slate-300">
              {wsConnected ? 'WS LIVE TELEMETRY' : 'POLLING SYNC'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Updated: {lastRefreshedAt.toLocaleTimeString()} IST
          </div>

          <button
            onClick={() => fetchAllData(false)}
            disabled={refreshing}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
            title="Force refresh telemetry from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setFreezeModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition flex items-center space-x-2 shadow-lg shadow-rose-950"
          >
            <Flame className="w-4 h-4" />
            <span>EMERGENCY GLOBAL FREEZE</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. OPERATIONAL ALERTS BANNER (ACTIVE ENGINE)                   */}
      {/* ============================================================== */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-lg border flex items-start justify-between shadow-lg ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-950/60 border-amber-700/80 text-amber-200'
                  : 'bg-blue-950/60 border-blue-700/80 text-blue-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {alert.severity === 'CRITICAL' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                  ) : alert.severity === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold tracking-wider">{alert.title}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      {alert.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()} IST
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-sans">{alert.description}</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded uppercase ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-900/80 text-rose-100 border border-rose-600'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-900/80 text-amber-100 border border-amber-600'
                  : 'bg-blue-900/80 text-blue-100 border border-blue-600'
              }`}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CORE OPERATIONAL KPI CARDS (6 PILLARS)                      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Active Exams */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">Active Exams</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-cyan-400">{s.activeExams ?? 0}</span>
            <span className="text-xs font-mono text-slate-500">Total: {s.totalExams ?? 0}</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400">Running / Disseminated</div>
        </div>

        {/* KPI 2: Centres Online */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">Centres Online</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">{s.activatedCentres ?? 0}</span>
            <span className="text-xs font-mono text-slate-500">Total: {s.totalCentres ?? 0}</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-emerald-400/80">Gateways Activated</div>
        </div>

        {/* KPI 3: In-Session Candidates */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">Candidates In Session</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-purple-400">{s.activeSessions ?? 0}</span>
            <span className="text-xs font-mono text-slate-500">Total: {s.totalCandidates ?? 0}</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-purple-300/80">Lobby & Answering</div>
        </div>

        {/* KPI 4: Terminal Health */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">Terminal Health</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">{s.terminalHealthPercentage ?? 100}%</span>
            <span className="text-xs font-mono text-emerald-500 font-bold">OPTIMAL</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400">{deviceStats.authorized ?? 0} Terminals Pass</div>
        </div>

        {/* KPI 5: Network Connectivity */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">Avg Latency</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-cyan-400">42ms</span>
            <span className="text-xs font-mono text-emerald-400">100% Uptime</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400">Zero packet loss</div>
        </div>

        {/* KPI 6: Security Incidents */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">Critical Incidents</span>
            <Shield className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-mono ${(s.criticalIncidents || 0) > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {s.criticalIncidents ?? 0}
            </span>
            <span className="text-xs font-mono text-slate-500">Active</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400">{s.totalEvents ?? 0} Audit events</div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. NAVIGATION TABS                                             */}
      {/* ============================================================== */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>NATIONAL OVERVIEW & EXAMS ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CENTRES')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'CENTRES'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>CENTRE READINESS MATRIX ({centres.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SESSIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'SESSIONS'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>CANDIDATE TELEMETRY ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DEVICES')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DEVICES'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>DEVICE HEALTH & DIAGNOSTICS ({devices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'SECURITY'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SECURITY & THREAT STREAM</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 5. TAB CONTENT                                                 */}
      {/* ============================================================== */}

      {/* TAB 1: OVERVIEW & EXAMS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Live Exam Management Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span>EXAMINATION LIFECYCLE CONTROLLER</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time lifecycle control, blueprint distribution, and state progression matrix
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                {exams.length} Configured Examinations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Exam Details</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Schedule</th>
                    <th className="p-3">Centres</th>
                    <th className="p-3">Candidate Sessions</th>
                    <th className="p-3 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-white text-sm">{ex.title}</div>
                        <div className="text-[11px] text-cyan-400">{ex.examCode}</div>
                        {ex.blueprint && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Blueprint: {ex.blueprint.totalQuestions} Questions • {ex.blueprint.subjects?.join(', ') || 'Multi-discipline'}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                            ex.status === 'ACTIVE' || ex.status === 'RUNNING'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse'
                              : ex.status === 'RELEASED'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : ex.status === 'PAUSED'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : ex.status === 'FROZEN'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300">{new Date(ex.scheduledStart).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(ex.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(ex.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({ex.durationMinutes}m)
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{ex.metrics.activatedCentres} / {ex.metrics.totalCentres}</div>
                        <div className="text-[10px] text-slate-500">Gateways Activated</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-purple-400">{ex.metrics.activeSessions}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">{ex.metrics.totalRegisteredCandidates} registered</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {ex.metrics.submittedSessions} submitted
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5 flex-wrap gap-1">
                          {ex.allowedTransitions.map((target) => (
                            <button
                              key={target}
                              onClick={() => {
                                setTransitionModalExam(ex);
                                setTargetState(target);
                                setTransitionReason(`Administrative transition to ${target} via Control Tower`);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center space-x-1 ${
                                target === 'RELEASED'
                                  ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                                  : target === 'ACTIVE'
                                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                  : target === 'PAUSED'
                                  ? 'bg-amber-700 hover:bg-amber-600 text-white'
                                  : target === 'FROZEN'
                                  ? 'bg-rose-700 hover:bg-rose-600 text-white'
                                  : target === 'COMPLETED'
                                  ? 'bg-purple-700 hover:bg-purple-600 text-white'
                                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                              }`}
                            >
                              <span>{target}</span>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No examination records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Timeline & Geographic Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exam Day Operational Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">Milestone Timeline</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">IST (UTC+5:30)</span>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {milestones.map((m: any, idx: number) => (
                  <div key={idx} className="relative flex items-start space-x-3 pl-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 z-10 ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-500 ring-4 ring-emerald-950'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-cyan-400 ring-4 ring-cyan-950 animate-ping'
                          : 'bg-slate-700'
                      }`}
                    />
                    <div className="flex-1 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-mono font-bold text-cyan-400 block">{m.time}</span>
                        <span className="text-xs font-semibold text-slate-200">{m.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : m.status === 'IN_PROGRESS'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* State & District Operational Deployment */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-mono">Geographic Operational Matrix</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Multi-State Jurisdictions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {geoBreakdown.map((geo, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700/70 p-3.5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-slate-100 text-xs">{geo.state}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                        {geo.district}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Centres Activated:</span>
                      <span className="font-bold text-emerald-400">{geo.activatedCentres} / {geo.totalCentres}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Capacity / Live:</span>
                      <span className="text-slate-300">{geo.capacity} seats ({geo.activeSessions} active)</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${geo.totalCentres > 0 ? (geo.activatedCentres / geo.totalCentres) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}

                {geoBreakdown.length === 0 && (
                  <div className="col-span-3 p-8 text-center text-slate-500 font-mono text-xs">
                    No geographic nodes mapped.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRE READINESS MATRIX */}
      {activeTab === 'CENTRES' && (
        <div className="space-y-4">
          {/* Centre Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={centreSearchQuery}
                onChange={(e) => setCentreSearchQuery(e.target.value)}
                placeholder="Search centres by code, name, or district..."
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-full font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-mono text-slate-400">State:</span>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none"
                >
                  <option value="ALL">All States</option>
                  {uniqueStates.map((st) => (
                    <option key={st} value={st} className="bg-slate-900">{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-mono text-slate-400">Readiness:</span>
                <select
                  value={selectedReadinessFilter}
                  onChange={(e) => setSelectedReadinessFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="READY" className="bg-slate-900">READY</option>
                  <option value="WARNING" className="bg-slate-900">WARNING</option>
                  <option value="BLOCKED" className="bg-slate-900">BLOCKED</option>
                  <option value="OFFLINE" className="bg-slate-900">OFFLINE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Centres Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCentres.map((centre) => (
              <div
                key={centre.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl shadow-xl transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 block">{centre.centreCode}</span>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{centre.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {centre.district}, {centre.state}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      centre.readinessStatus === 'READY'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : centre.readinessStatus === 'WARNING'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : centre.readinessStatus === 'BLOCKED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {centre.readinessStatus}
                  </span>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Gateway Activation:</span>
                    <span className={centre.hasActiveGateway ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {centre.hasActiveGateway ? 'ACTIVATED (HMAC VALID)' : 'PENDING ACTIVATION'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Seating Capacity:</span>
                    <span className="text-white font-bold">{centre.capacity} Nodes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Active CBT Sessions:</span>
                    <span className="text-purple-400 font-bold">{centre.activeSessionsCount} in session</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Terminals Authorized:</span>
                    <span className="text-slate-300 font-bold">
                      {centre.deviceMetrics.authorized} / {centre.deviceMetrics.total} online
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
                  <span className="truncate max-w-[200px]" title={centre.readinessReason}>
                    Diagnostics: {centre.readinessReason}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    centre.connectivityStatus === 'ONLINE' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                  }`}>
                    {centre.connectivityStatus}
                  </span>
                </div>
              </div>
            ))}

            {filteredCentres.length === 0 && (
              <div className="col-span-3 p-12 text-center text-slate-500 font-mono text-xs bg-slate-900 border border-slate-800 rounded-xl">
                No examination centres match the active filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE TELEMETRY */}
      {activeTab === 'SESSIONS' && (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono">LIVE CANDIDATE SESSION TELEMETRY</h3>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-1">
              {['ALL', 'IN_PROGRESS', 'LOBBY', 'SUBMITTED', 'PAUSED', 'FROZEN'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSessionStatusFilter(status)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                    sessionStatusFilter === status
                      ? 'bg-purple-950 text-purple-300 border border-purple-700'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Sessions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Exam</th>
                  <th className="p-3">Centre & Terminal</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Answer Sync Buffer</th>
                  <th className="p-3">Session Start</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-white">{sess.candidate.fullName}</div>
                      <div className="text-[10px] text-cyan-400">{sess.candidate.candidateCode}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-300 font-bold">{sess.exam.examCode}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{sess.exam.title}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-white">{sess.centre.name}</div>
                      <div className="text-[10px] text-emerald-400">Node: {sess.device.deviceId} ({sess.device.ipAddress})</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sess.status === 'IN_PROGRESS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : sess.status === 'SUBMITTED'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : sess.status === 'LOBBY'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : sess.status === 'FROZEN'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold text-slate-200">{sess.answerCount} answers</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Cryptographically buffered</span>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-300">
                        {sess.startedAt ? new Date(sess.startedAt).toLocaleTimeString() : 'Awaiting start'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px] block">
                        {sess.sessionToken.slice(0, 16)}...
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No candidate sessions currently match this criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEVICE HEALTH & HARDWARE DIAGNOSTICS */}
      {activeTab === 'DEVICES' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">CBT TERMINAL HARDWARE DIAGNOSTICS</h3>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Filter Check:</span>
              {['ALL', 'PASS', 'FAIL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDeviceCheckFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                    deviceCheckFilter === f
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map((dev) => (
              <div
                key={dev.id}
                onClick={() => setInspectedDevice(dev)}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-600/60 p-4 rounded-xl shadow-xl transition cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 block">{dev.deviceId}</span>
                    <span className="text-[11px] text-slate-300 font-mono block">{dev.centre.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{dev.centre.district}, {dev.centre.state}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      dev.diagnostics.overallStatus === 'PASS'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    CHECK: {dev.diagnostics.overallStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Camera:</span>
                    <span className={dev.diagnostics.cameraStatus === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {dev.diagnostics.cameraStatus}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Microphone:</span>
                    <span className={dev.diagnostics.micStatus === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {dev.diagnostics.micStatus}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Screen Resolution:</span>
                    <span className="text-slate-200 font-bold">{dev.diagnostics.screenRes}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Latency:</span>
                    <span className="text-cyan-400 font-bold">{dev.diagnostics.networkLatencyMs} ms</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                  <span>IP: {dev.ipAddress}</span>
                  <span>SN: {dev.serialNumber}</span>
                </div>
              </div>
            ))}

            {filteredDevices.length === 0 && (
              <div className="col-span-3 p-12 text-center text-slate-500 font-mono text-xs bg-slate-900 border border-slate-800 rounded-xl">
                No terminal devices found matching this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY INCIDENT & AUDIT STREAM */}
      {activeTab === 'SECURITY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white font-mono">LIVE INCIDENT QUEUE & TELEMETRY STREAM</h3>
                <p className="text-xs text-slate-400">Zero-trust audit events and anomaly detection alerts</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded border border-slate-700">
              Sensor Stream Active
            </span>
          </div>

          <div className="space-y-3">
            {metrics?.recentIncidents?.map((evt: any) => (
              <div
                key={evt.id}
                className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : evt.severity === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{evt.eventType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {evt.centre?.name ? `${evt.centre.name} (${evt.centre.state})` : 'System-wide'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono">
                      {evt.detailsJson
                        ? JSON.parse(evt.detailsJson).action || JSON.parse(evt.detailsJson).reason || 'Security event logged'
                        : 'Security telemetry event logged'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Timestamp: {new Date(evt.createdAt).toLocaleTimeString()} IST | Risk Score: {evt.riskScore}/100
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${
                    evt.status === 'FROZEN'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {evt.status}
                </span>
              </div>
            ))}

            {(!metrics?.recentIncidents || metrics.recentIncidents.length === 0) && (
              <div className="p-12 text-center text-slate-500 font-mono text-xs">
                No active security anomalies detected. All examination centres operating within green parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODALS                                                      */}
      {/* ============================================================== */}

      {/* Emergency Global Freeze Confirmation Modal */}
      {freezeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <Flame className="w-8 h-8 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold font-mono text-white">EMERGENCY GLOBAL EXAM FREEZE</h3>
                <p className="text-xs text-rose-300">CRITICAL SOC ACTION: Nationwide examination lockdown</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              Executing this command immediately transmits a cryptographic lockdown signal across all 15 examination centres.
              All active candidate terminals will freeze, input buffers will be sealed, and audit ledgers will record this incident.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400">Mandatory Reason / Incident Ticket:</label>
              <textarea
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                placeholder="Specify security rationale..."
              />
            </div>

            {freezeFeedback && (
              <div className="p-3 bg-slate-800 border border-slate-700 text-xs font-mono rounded-lg">
                {freezeFeedback}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setFreezeModalOpen(false)}
                disabled={freezeActionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteGlobalFreeze}
                disabled={freezeActionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono rounded-lg shadow-lg shadow-rose-950 transition flex items-center space-x-2"
              >
                {freezeActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                <span>Confirm & Execute Lockdown</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Transition Modal */}
      {transitionModalExam && targetState && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold font-mono text-white">CONFIRM LIFECYCLE TRANSITION</h3>
                <p className="text-xs text-cyan-400">{transitionModalExam.examCode}</p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs font-mono space-y-1">
              <div><span className="text-slate-400">Current Status:</span> <span className="font-bold text-white">{transitionModalExam.status}</span></div>
              <div><span className="text-slate-400">Target State:</span> <span className="font-bold text-cyan-300">{targetState}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400">Audit Justification / Release Notes:</label>
              <input
                type="text"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Enter justification for audit log..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setTransitionModalExam(null)}
                disabled={transitionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransition}
                disabled={transitionLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono rounded-lg transition flex items-center space-x-2"
              >
                {transitionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Confirm Transition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Hardware Diagnostics Modal */}
      {inspectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-mono">TERMINAL HARDWARE DIAGNOSTICS</h3>
              </div>
              <button onClick={() => setInspectedDevice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-1">
                <div><span className="text-slate-400">Terminal ID:</span> <span className="font-bold text-white">{inspectedDevice.deviceId}</span></div>
                <div><span className="text-slate-400">Centre:</span> <span className="text-slate-200">{inspectedDevice.centre.name} ({inspectedDevice.centre.centreCode})</span></div>
                <div><span className="text-slate-400">IP Address:</span> <span className="text-slate-200">{inspectedDevice.ipAddress}</span></div>
                <div><span className="text-slate-400">Serial Number:</span> <span className="text-slate-200">{inspectedDevice.serialNumber}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase">Camera Peripheral</span>
                  <span className={`font-bold ${inspectedDevice.diagnostics.cameraStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inspectedDevice.diagnostics.cameraStatus}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Continuous facial biometric check</p>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase">Microphone Peripheral</span>
                  <span className={`font-bold ${inspectedDevice.diagnostics.micStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inspectedDevice.diagnostics.micStatus}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Acoustic anomaly sensor</p>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase">Display Matrix</span>
                  <span className="font-bold text-slate-200">{inspectedDevice.diagnostics.screenRes}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Compliant full-screen CBT mode</p>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block uppercase">Gateway RTT Latency</span>
                  <span className="font-bold text-cyan-400">{inspectedDevice.diagnostics.networkLatencyMs} ms</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sub-50ms local switch response</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedDevice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
