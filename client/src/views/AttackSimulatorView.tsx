import { useState } from 'react';
import { Zap, ShieldAlert, Play, CheckCircle2, XCircle } from 'lucide-react';
import { fetchApi } from '../services/api';

export const AttackSimulatorView: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const scenarios = [
    {
      id: 'DEMO_1',
      title: 'DEMO 1: Unauthorized API Access Attempt',
      desc: 'Candidate role attempts direct fetch to privileged Question Vault API.',
      expected: 'HTTP 403 Forbidden with Zero-Trust Security Exception.',
    },
    {
      id: 'DEMO_2',
      title: 'DEMO 2: Expired / Invalid Activation Token',
      desc: 'Rogue Centre Admin attempts activation using an expired or tampered token.',
      expected: 'Rejected by Centre Gateway Verification Engine (401).',
    },
    {
      id: 'DEMO_3',
      title: 'DEMO 3: Unregistered Terminal Device',
      desc: 'Unauthorized hardware MAC joins examination network to request JIT payload.',
      expected: 'Device placed in DEVICE_NOT_AUTHORIZED state & JIT delivery blocked.',
    },
    {
      id: 'DEMO_4',
      title: 'DEMO 4: Insider Bulk Question Access Attempt',
      desc: 'Privileged user attempts bulk export of 45 vault questions simultaneously.',
      expected: 'AI Threat Engine assigns High Risk (>85 score) & locks session.',
    },
    {
      id: 'DEMO_5',
      title: 'DEMO 5: Tampered Audit Trail Event',
      desc: 'Database administrator alters historical audit record payload directly in DB.',
      expected: 'SHA-256 Hash Chain Integrity Inspector flags broken block index.',
    },
    {
      id: 'DEMO_6',
      title: 'DEMO 6: Leaked Question Screenshot Upload',
      desc: 'Security officer uploads leaked exam snippet from social media channel.',
      expected: 'Semantic OCR + Cosine Similarity Pipeline identifies Q-10283 (>95% match).',
    },
    {
      id: 'DEMO_7',
      title: 'DEMO 7: Emergency Global Exam Freeze',
      desc: 'SOC Controller executes emergency freeze during active examination.',
      expected: 'Real-time WebSocket event broadcast; All CBT sessions lock down.',
    },
  ];

  const handleRunScenario = async (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setLoading(true);
    setSimResult(null);

    try {
      const data = await fetchApi('/simulator/execute', {
        method: 'POST',
        body: JSON.stringify({ scenarioId }),
      });
      setSimResult(data);
    } catch (err: any) {
      setSimResult({
        status: 'BLOCKED_BY_DEFENSE',
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 flex items-center justify-between shadow-2xl bg-amber-950/10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 animate-pulse">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">INTERACTIVE ATTACK SIMULATION CONTROL ROOM</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                7 JUDGE DEMO SCENARIOS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live Security Vector Execution & System Defense Verification
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenarios Selection List */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono">SELECT DEMO ATTACK VECTOR</h3>

          <div className="space-y-3">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => handleRunScenario(sc.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeScenario === sc.id
                    ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold font-mono">{sc.title}</div>
                  <p className="text-[11px] text-slate-400 font-sans">{sc.desc}</p>
                </div>

                <button
                  disabled={loading && activeScenario === sc.id}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] flex items-center space-x-1 flex-shrink-0 ml-3"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Execution Output Log */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono">DEFENSE RESPONSE LOG & OUTPUT</h3>

          {loading ? (
            <div className="p-10 text-center text-xs text-amber-400 font-mono animate-pulse">
              Executing attack scenario vector & capturing system response...
            </div>
          ) : simResult ? (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Scenario: <strong className="text-amber-400">{simResult.scenario || activeScenario}</strong></span>
                <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${
                  simResult.status === 'BLOCKED' || simResult.status === 'REJECTED' || simResult.status === 'DETECTED' || simResult.status === 'MATCH_CONFIRMED' || simResult.status === 'EXAM_FROZEN'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  DEFENSE STATUS: {simResult.status || 'INTERCEPTED'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-slate-400">Expected System Defense:</div>
                <div className="text-slate-200 font-sans text-xs bg-slate-950 p-2.5 rounded border border-slate-800/80">
                  {simResult.expectedBehavior || simResult.details}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-400">Raw JSON Payload Response:</div>
                <pre className="p-3 bg-slate-950 text-emerald-400 text-[10px] rounded-lg overflow-x-auto border border-slate-800/80">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 font-mono">
              Click any of the 7 Attack Scenarios on the left to execute live demonstration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
