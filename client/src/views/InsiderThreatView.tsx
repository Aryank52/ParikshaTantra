import { useState } from 'react';
import { UserX, ShieldAlert, Cpu } from 'lucide-react';

export const InsiderThreatView: React.FC = () => {
  const [testVolume, setTestVolume] = useState(25);
  const [testHour, setTestHour] = useState(2);
  const [testRole, setTestRole] = useState('QUESTION_REVIEWER');
  const [riskAssessment, setRiskAssessment] = useState<any>(null);

  const handleEvaluateThreat = () => {
    let score = 0;
    const reasons: string[] = [];

    if (testVolume > 15) {
      score += 45;
      reasons.push(`Bulk question retrieval anomaly: ${testVolume} questions accessed in a single query.`);
    } else if (testVolume > 5) {
      score += 20;
      reasons.push(`Elevated question retrieval volume: ${testVolume} questions.`);
    }

    if (testHour >= 23 || testHour < 5) {
      score += 25;
      reasons.push(`Off-hours vault access recorded at ${testHour}:00 hrs.`);
    }

    if (testRole === 'CANDIDATE') {
      score = 100;
      reasons.push('CRITICAL: Candidate role attempting direct Question Vault access.');
    }

    score = Math.min(100, score);
    let level = 'LOW';
    let action = 'NONE';

    if (score >= 85) { level = 'CRITICAL'; action = 'FREEZE_EXAM & LOCK_SESSION'; }
    else if (score >= 60) { level = 'HIGH'; action = 'LOCK_SESSION'; }
    else if (score >= 35) { level = 'MEDIUM'; action = 'MONITOR'; }

    setRiskAssessment({
      score,
      level,
      action,
      reasons,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <UserX className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">AI Insider Threat & Anomaly Engine</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                EXPLAINABLE AI RISK MATRIX
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Detects Bulk Question Access • Off-Hours Anomalies • Privilege Escalation Patterns
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator Parameters */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono">SIMULATE PRIVILEGED BEHAVIOR</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400">Actor Role</label>
              <select
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-amber-500 mt-1"
                value={testRole}
                onChange={(e) => setTestRole(e.target.value)}
              >
                <option value="QUESTION_REVIEWER">QUESTION_REVIEWER</option>
                <option value="EXAM_CONTROLLER">EXAM_CONTROLLER</option>
                <option value="CENTRE_ADMIN">CENTRE_ADMIN</option>
                <option value="CANDIDATE">CANDIDATE</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Questions Accessed Simultaneously ({testVolume})</label>
              <input
                type="range"
                min="1"
                max="50"
                className="w-full mt-2 accent-amber-500"
                value={testVolume}
                onChange={(e) => setTestVolume(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-slate-400">Access Time Hour ({testHour}:00 hrs)</label>
              <input
                type="range"
                min="0"
                max="23"
                className="w-full mt-2 accent-amber-500"
                value={testHour}
                onChange={(e) => setTestHour(Number(e.target.value))}
              />
            </div>

            <button
              onClick={handleEvaluateThreat}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Evaluate Threat Risk Score (Explainable AI)</span>
            </button>
          </div>
        </div>

        {/* Output Matrix */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono">RISK SCORE & EXPLANATION BREAKDOWN</h3>

          {riskAssessment ? (
            <div className="space-y-4">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-2">
                <div className="text-xs text-slate-400 font-mono uppercase">Calculated Risk Score</div>
                <div className={`text-4xl font-black font-mono ${
                  riskAssessment.score >= 80 ? 'text-red-400' : riskAssessment.score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {riskAssessment.score} / 100
                </div>
                <div className="text-xs font-mono font-bold text-slate-300">
                  Level: <span className="text-amber-400">{riskAssessment.level}</span> | Recommended Action: <span className="text-red-400">{riskAssessment.action}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 font-mono">EXPLANABLE REASONS:</div>
                {riskAssessment.reasons.map((r: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 font-mono">
              Adjust parameters on the left to run threat evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
