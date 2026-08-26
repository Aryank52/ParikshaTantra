import { useState, useEffect } from 'react';
import { Vault, ShieldCheck, CheckCircle2, AlertTriangle, Key, Plus, Lock, Send, RefreshCw, Layers, Shield, ArrowRight } from 'lucide-react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Question, Exam } from '../types';

export const AuthorityPortal: React.FC = () => {
  const { user, token, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'VAULT' | 'BLUEPRINT' | 'GLOBAL_RELEASE'>('VAULT');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Form states
  const [newQSubject, setNewQSubject] = useState('Mathematics');
  const [newQTopic, setNewQTopic] = useState('Calculus & Algebra');
  const [newQDifficulty, setNewQDifficulty] = useState('MEDIUM');
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['Option A', 'Option B', 'Option C', 'Option D']);
  const [newQCorrect, setNewQCorrect] = useState(0);

  // Release state
  const [selectedExamId, setSelectedExamId] = useState('');
  const [releaseResults, setReleaseResults] = useState<any>(null);

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qRes = await fetchApi('/vault/questions');
      setQuestions(qRes.questions || []);

      const eRes = await fetchApi('/exams');
      setExams(eRes || []);
      if (eRes.length > 0) setSelectedExamId(eRes[0].id);
    } catch (err: any) {
      setMsg(err.message || 'Error loading authority data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  if (!user || !token) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Vault className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">AUTHENTICATION REQUIRED FOR QUESTION VAULT</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Zero-Trust 4-Eyes cryptographic question vaulting and exam blueprint synthesis require verified National Authority credentials.
          </p>
          <button
            onClick={() => switchUser('national_admin')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 inline-flex items-center space-x-2 transition-all"
          >
            <span>Authenticate as National Authority</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Create Question in DRAFT
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText) return;

    try {
      await fetchApi('/vault/create', {
        method: 'POST',
        body: JSON.stringify({
          subject: newQSubject,
          topic: newQTopic,
          difficulty: newQDifficulty,
          plainTextContent: newQText,
          options: newQOptions,
          correctAnswerIndex: newQCorrect,
        }),
      });
      setNewQText('');
      setMsg('Question created in DRAFT state & AES-256 encrypted');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 4-Eyes Dual Approval Handler
  const handleApproveDual = async (questionId: string, slot: 'A' | 'B') => {
    try {
      const data = await fetchApi(`/vault/approve-dual/${questionId}`, {
        method: 'POST',
        body: JSON.stringify({ approverSlot: slot }),
      });
      setMsg(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Generate Exam Blueprint
  const handleGenerateBlueprint = async (examId: string) => {
    try {
      const data = await fetchApi('/blueprint/generate', {
        method: 'POST',
        body: JSON.stringify({ examId }),
      });
      setMsg(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Global Exam Release Execution
  const handleGlobalRelease = async () => {
    if (!selectedExamId) return;
    if (!window.confirm('CRITICAL SECURITY ACTION: Execute Global Exam Release? This will generate short-lived activation tokens for all centres.')) return;

    try {
      const data = await fetchApi('/exams/global-release', {
        method: 'POST',
        body: JSON.stringify({ examId: selectedExamId }),
      });
      setReleaseResults(data);
      setMsg(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Vault className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">National & State Examination Authority Console</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                4-EYES & AES-256 VAULT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Encrypted Question Lifecycle • Blueprint Engine • Short-Lived Centre Activation Derivation
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('VAULT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'VAULT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Question Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('BLUEPRINT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'BLUEPRINT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Blueprint Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('GLOBAL_RELEASE')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'GLOBAL_RELEASE' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Global Exam Release</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* TAB 1: QUESTION VAULT */}
      {activeTab === 'VAULT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Question Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Create Question (DRAFT)</span>
            </h3>

            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Subject</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={newQSubject}
                  onChange={(e) => setNewQSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-slate-400">Topic</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={newQTopic}
                  onChange={(e) => setNewQTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="text-slate-400">Difficulty</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={newQDifficulty}
                  onChange={(e) => setNewQDifficulty(e.target.value)}
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Question Text</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Enter canonical question text..."
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-blue-500/20"
              >
                Save & AES-256 Encrypt Question
              </button>
            </form>
          </div>

          {/* Question Vault List with 4-Eyes Badges */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 font-mono">CRYPTOGRAPHIC QUESTION VAULT</h3>
              <span className="text-xs text-slate-400 font-mono">Total Questions: {questions.length}</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {questions.map((q) => (
                <div key={q.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-400">{q.questionCode}</span>
                      <span className="text-slate-400">• {q.subject} ({q.difficulty})</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                        q.status === 'ENCRYPTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {q.status === 'ENCRYPTED' ? '4-EYES VAULTED' : q.status}
                    </span>
                  </div>

                  {/* 4-Eyes Dual Approval Badge Strip */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-800">
                      <span>Approver A: <strong className="text-slate-200">{q.approvedByA || 'Pending'}</strong></span>
                      {!q.approvedByA && (
                        <button
                          onClick={() => handleApproveDual(q.id, 'A')}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                        >
                          Sign A
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-800">
                      <span>Approver B: <strong className="text-slate-200">{q.approvedByB || 'Pending'}</strong></span>
                      {!q.approvedByB && (
                        <button
                          onClick={() => handleApproveDual(q.id, 'B')}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                        >
                          Sign B
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BLUEPRINT ENGINE */}
      {activeTab === 'BLUEPRINT' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">EXAM BLUEPRINT ENGINE</h3>

          <div className="space-y-4">
            {exams.map((ex) => (
              <div key={ex.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-100">{ex.title} ({ex.examCode})</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled: {new Date(ex.scheduledStart).toLocaleString()} | Status: <span className="text-blue-400 font-mono">{ex.status}</span>
                  </p>
                  {ex.blueprint && (
                    <div className="text-[11px] font-mono text-emerald-400 mt-2">
                      ✓ Cryptographically Signed Blueprint Active | Signed Checksum: {ex.blueprint.signedChecksum.substring(0, 20)}...
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleGenerateBlueprint(ex.id)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Generate & Sign Blueprint</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL EXAM RELEASE */}
      {activeTab === 'GLOBAL_RELEASE' && (
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 space-y-6 bg-amber-950/10">
          <div className="flex items-center space-x-3 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="text-lg font-extrabold text-slate-100">GLOBAL EXAM RELEASE CONTROL ROOM</h3>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs text-slate-400">Select Scheduled Exam for Release</label>
              <select
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-amber-500 mt-1"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.examCode}: {ex.title} [{ex.status}]
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGlobalRelease}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl shadow-xl shadow-amber-500/20 text-sm transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>EXECUTE GLOBAL EXAM RELEASE (Derive Activation Tokens)</span>
            </button>
          </div>

          {/* Derived Activation Tokens Display Table */}
          {releaseResults && releaseResults.centreActivations && (
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                ✓ Derived Short-Lived Centre Activation Tokens (15-Min Expiry)
              </h4>

              <div className="space-y-2">
                {releaseResults.centreActivations.map((act: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-300 font-bold">{act.centreName}</span>
                      <span className="text-slate-500 ml-2">({act.centreCode})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 font-extrabold border border-emerald-500/30 rounded-lg tracking-wider">
                        {act.activationToken}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
