import { useState, useEffect } from 'react';
import { Building2, Key, MonitorCheck, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { fetchApi } from '../services/api';

export const CentrePortal: React.FC = () => {
  const [centreData, setCentreData] = useState<any>(null);
  const [activationTokenInput, setActivationTokenInput] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('EXAM-NAT-2026');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCentre = async () => {
    setLoading(true);
    try {
      // Load Delhi Centre by default
      const data = await fetchApi('/centres/CENTRE-DELHI-01');
      setCentreData(data);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentre();
  }, []);

  // Centre Gateway Activation Execution
  const handleActivateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationTokenInput) return;

    try {
      const data = await fetchApi('/centres/activate', {
        method: 'POST',
        body: JSON.stringify({
          centreId: centreData.id,
          examId: centreData.activations?.[0]?.examId || 'EXAM-NAT-2026',
          activationToken: activationTokenInput,
        }),
      });
      setMsg(data.message);
      loadCentre();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6 text-slate-400 font-mono text-xs">Loading Centre Gateway Status...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Centre Gateway Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">{centreData.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                CODE: {centreData.centreCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              State: <strong className="text-slate-200">{centreData.state}</strong> | District: <strong className="text-slate-200">{centreData.district}</strong> | Capacity: <strong className="text-slate-200">{centreData.capacity} Terminals</strong>
            </p>
          </div>
        </div>

        {/* Gateway Status Badge */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Gateway Security State</div>
            <div className={`text-sm font-extrabold font-mono ${centreData.status === 'ACTIVATED' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {centreData.status}
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${centreData.status === 'ACTIVATED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gateway Activation Token Entry Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <Key className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-200 font-mono">CENTRE GATEWAY ACTIVATION</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Enter or scan the derived short-lived Activation Token issued by the Central Examination Authority upon Global Exam Release.
          </p>

          <form onSubmit={handleActivateGateway} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400">Activation Token (ACT-EXAM-CENTRE-...)</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono font-bold uppercase focus:outline-none focus:border-blue-500 mt-1 tracking-wider"
                placeholder="ACT-EXAM-NAT-2026-CENTRE-DELHI-01-..."
                value={activationTokenInput}
                onChange={(e) => setActivationTokenInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validate & Activate Centre Gateway</span>
            </button>
          </form>
        </div>

        {/* Registered Devices Grid */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 font-mono">REGISTERED TERMINAL DEVICES</h3>
            <span className="text-xs text-slate-400 font-mono">Active Nodes: {centreData.devices?.length || 0}</span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {centreData.devices?.map((dev: any) => (
              <div key={dev.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{dev.deviceId}</div>
                    <div className="text-[10px] text-slate-400">SN: {dev.serialNumber} | IP: {dev.ipAddress}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    dev.status === 'AUTHORIZED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {dev.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
