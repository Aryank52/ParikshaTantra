import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Server, Cpu, Wifi, Activity, Lock, AlertTriangle, CheckCircle, 
  RefreshCw, Radio, Terminal, Users, Database, FileKey, Zap
} from 'lucide-react';
import { api } from '../services/api';

interface ReadinessCheck {
  id: string;
  name: string;
  category: string;
  status: 'READY' | 'WARNING' | 'FAILED';
  details: string;
  mandatory: boolean;
}

interface ReadinessReport {
  centreId: string;
  centreCode: string;
  centreName: string;
  overallStatus: 'GO' | 'CONDITIONAL_GO' | 'NO_GO';
  passedCount: number;
  totalCount: number;
  scorePercentage: number;
  checks: ReadinessCheck[];
  evaluatedAt: string;
}

export const CentreGatewayView: React.FC = () => {
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [selectedCentre, setSelectedCentre] = useState<any>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [activationToken, setActivationToken] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activationMessage, setActivationMessage] = useState<string>('');

  useEffect(() => {
    fetchCentres();
    fetchExams();
  }, []);

  const fetchCentres = async () => {
    try {
      const data = await api.get('/centres');
      setCentres(data);
      if (data.length > 0 && !selectedCentreId) {
        setSelectedCentreId(data[0].id);
        loadCentreDetail(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load centres', err);
    }
  };

  const fetchExams = async () => {
    try {
      const data = await api.get('/exams');
      setExams(data);
      if (data.length > 0) setSelectedExamId(data[0].id);
    } catch (err) {
      console.error('Failed to load exams', err);
    }
  };

  const loadCentreDetail = async (id: string) => {
    setLoading(true);
    try {
      const detail = await api.get(`/centres/${id}`);
      setSelectedCentre(detail);
      const readReport = await api.get(`/centres/${id}/readiness`);
      setReadiness(readReport);
    } catch (err) {
      console.error('Failed to load detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCentreChange = (id: string) => {
    setSelectedCentreId(id);
    loadCentreDetail(id);
  };

  const handleActivateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationToken || !selectedExamId || !selectedCentreId) return;
    try {
      setLoading(true);
      const res = await api.post('/centres/activate', {
        centreId: selectedCentreId,
        examId: selectedExamId,
        activationToken,
      });
      setActivationMessage(`✅ ${res.message}`);
      loadCentreDetail(selectedCentreId);
    } catch (err: any) {
      setActivationMessage(`❌ Activation Error: ${err.message || 'Invalid activation token'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-cyan-400 animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">CENTRE GATEWAY CONTROLLER</h1>
              <p className="text-slate-400 text-sm">Virtual Local Edge Node & Pre-Exam Readiness Pipeline</p>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <label className="text-xs font-semibold uppercase text-slate-400">Select Centre Node:</label>
          <select
            value={selectedCentreId}
            onChange={(e) => handleCentreChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-cyan-300 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.centreCode} - {c.name} ({c.state})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadCentreDetail(selectedCentreId)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-md transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {selectedCentre && (
        <>
          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                <span>Gateway Status</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-xl font-bold ${selectedCentre.status === 'ACTIVATED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedCentre.status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedCentre.connectivityStatus}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                <span>Readiness Score</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">
                  {readiness ? `${readiness.scorePercentage}%` : '--'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold font-mono ${
                  readiness?.overallStatus === 'GO' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500' :
                  readiness?.overallStatus === 'CONDITIONAL_GO' ? 'bg-amber-900/60 text-amber-300 border border-amber-500' :
                  'bg-rose-900/60 text-rose-300 border border-rose-500'
                }`}>
                  {readiness?.overallStatus || 'PENDING'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                <span>Authorized Nodes</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">
                  {selectedCentre.devices?.length || 0}
                </span>
                <span className="text-xs text-slate-400">Cap: {selectedCentre.capacity}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                <span>Security Perimeter</span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-xl font-bold ${
                  selectedCentre.securityStatus === 'GREEN' ? 'text-emerald-400' :
                  selectedCentre.securityStatus === 'YELLOW' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {selectedCentre.securityStatus} PERIMETER
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Readiness Checklist */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">10-Point Pre-Exam Readiness Audit</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {readiness ? `${readiness.passedCount}/${readiness.totalCount} Checks Passed` : ''}
                </span>
              </div>

              <div className="space-y-3">
                {readiness?.checks.map((chk) => (
                  <div key={chk.id} className="bg-slate-800/60 border border-slate-700/60 rounded-md p-3.5 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {chk.status === 'READY' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : chk.status === 'WARNING' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-200">{chk.name}</span>
                          {chk.mandatory && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded uppercase font-mono">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{chk.details}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                      chk.status === 'READY' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      chk.status === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gateway Activation Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <FileKey className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">HMAC Activation Portal</h2>
              </div>

              <form onSubmit={handleActivateGateway} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Select Live Examination
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md p-2.5 focus:ring-2 focus:ring-cyan-500"
                  >
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.examCode} - {e.title} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Centre-Derived HMAC Activation Token
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACT-MH01-998822"
                    value={activationToken}
                    onChange={(e) => setActivationToken(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-cyan-300 text-sm font-mono rounded-md p-2.5 focus:ring-2 focus:ring-cyan-500 uppercase tracking-widest"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Issued by Central Authority during Global Release event (15-min window).
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !activationToken}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-md transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950"
                >
                  <Zap className="w-4 h-4" />
                  <span>ACTIVATE CENTRE GATEWAY</span>
                </button>
              </form>

              {activationMessage && (
                <div className={`p-3 rounded-md text-xs font-mono border ${
                  activationMessage.startsWith('✅') ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' : 'bg-rose-950/80 border-rose-700 text-rose-300'
                }`}>
                  {activationMessage}
                </div>
              )}

              {/* Local Buffer Telemetry */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-md p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Local Answer Buffer:</span>
                  <span className="text-emerald-400 font-mono font-semibold">ENCRYPTED & ACCELERATED</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Zero-Knowledge Offline Sync:</span>
                  <span className="text-cyan-400 font-mono font-semibold">STANDBY (0 Pending)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
