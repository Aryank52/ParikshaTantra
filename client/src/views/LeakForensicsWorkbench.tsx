import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, GitBranch, Search, AlertTriangle, FileText, Cpu, CheckCircle2, 
  Lock, Eye, UserCheck, RefreshCw, Sparkles, Network, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export const LeakForensicsWorkbench: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [leakText, setLeakText] = useState<string>('Determine the speed of electromagnetic waves in a vacuum given magnetic permeability mu0 and permittivity epsilon0');
  const [evidenceTitle, setEvidenceTitle] = useState<string>('Telegram Leaked Snippet - Physics Q12');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      const data = await api.get('/leak/evidence');
      setEvidenceList(data);
      if (data.length > 0 && !selectedEvidence) {
        setSelectedEvidence(data[0]);
      }
    } catch (err) {
      console.error('Failed to load evidence', err);
    }
  };

  const handleRunMultiStageLeakAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leakText) return;
    setLoading(true);
    setAnalysisResult(null);
    try {
      const res = await api.post('/leak/analyze', {
        title: evidenceTitle,
        source: 'TELEGRAM_CHANNEL',
        textContent: leakText,
      });
      setAnalysisResult(res);
      fetchEvidence();
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl flex items-center space-x-4">
        <GitBranch className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">AI FORENSIC LEAK INVESTIGATION WORKBENCH</h1>
          <p className="text-slate-400 text-sm">Multi-Stage Leak Pipeline, Gemini AI Semantic Matcher & Question Exposure Graph</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Analyze Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">6-Stage Leak Analysis Engine</h2>
          </div>

          <form onSubmit={handleRunMultiStageLeakAnalysis} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Evidence Title
              </label>
              <input
                type="text"
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Suspected Leaked Text Content / OCR
              </label>
              <textarea
                rows={4}
                value={leakText}
                onChange={(e) => setLeakText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs rounded-md p-2.5 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !leakText}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-md transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950 text-sm"
            >
              <Cpu className="w-4 h-4" />
              <span>RUN MULTI-STAGE LEAK ANALYSIS</span>
            </button>
          </form>

          {/* Pipeline Stage Indicators */}
          <div className="bg-slate-950 border border-slate-800 rounded-md p-4 space-y-2 text-xs font-mono">
            <span className="text-slate-400 font-bold block mb-2">Multi-Stage Forensic Pipeline:</span>
            <div className="flex justify-between text-slate-300"><span>Stage 1: Canonical Hash</span><span className="text-emerald-400">PASSED</span></div>
            <div className="flex justify-between text-slate-300"><span>Stage 2: Token N-Gram</span><span className="text-emerald-400">PASSED</span></div>
            <div className="flex justify-between text-slate-300"><span>Stage 3: TF-IDF Similarity</span><span className="text-emerald-400">89.4%</span></div>
            <div className="flex justify-between text-slate-300"><span>Stage 4: Semantic Embeddings</span><span className="text-emerald-400">ACTIVE</span></div>
            <div className="flex justify-between text-slate-300"><span>Stage 5: Gemini AI Synthesis</span><span className="text-cyan-400">ENRICHED</span></div>
            <div className="flex justify-between text-slate-300"><span>Stage 6: Forensic Chain</span><span className="text-purple-400">AUDITED</span></div>
          </div>
        </div>

        {/* Results & Exposure Graph Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis Result */}
          {analysisResult && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-lg p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Gemini AI Forensic Leak Result</h3>
                </div>
                <span className="text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1 rounded font-bold uppercase">
                  MATCH CONFIRMED
                </span>
              </div>

              {analysisResult.topMatch && (
                <div className="bg-slate-800/80 p-4 rounded-md border border-slate-700 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Matched Question Code:</span>
                    <span className="text-cyan-300 font-bold">{analysisResult.topMatch.questionCode} ({analysisResult.topMatch.subject})</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Similarity Score:</span>
                    <span className="text-rose-400 font-bold text-sm">{analysisResult.topMatch.similarityScore}% ({analysisResult.topMatch.riskLevel})</span>
                  </div>
                  {analysisResult.aiAnalysisReport && (
                    <div className="mt-2 text-xs text-cyan-200 font-mono bg-slate-950 p-3 rounded border border-slate-800">
                      <strong>Gemini AI Synthesis:</strong> {analysisResult.aiAnalysisReport}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Visual Question Exposure Graph */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Visual Question Exposure & Insider Chain</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Trace Custody Node Linkage</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg font-mono text-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 text-center">
                <div className="bg-slate-900 border border-purple-500/40 p-3 rounded-lg flex-1 min-w-[120px]">
                  <span className="text-purple-400 font-bold block">Author Node</span>
                  <span className="text-slate-300 text-[11px]">Dr. V. Sharma</span>
                  <span className="text-[10px] text-slate-500 block">AES-256 Vaulted</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                <div className="bg-slate-900 border border-blue-500/40 p-3 rounded-lg flex-1 min-w-[120px]">
                  <span className="text-blue-400 font-bold block">4-Eyes Approvers</span>
                  <span className="text-slate-300 text-[11px]">Approver A & B</span>
                  <span className="text-[10px] text-slate-500 block">RSA Signed</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                <div className="bg-slate-900 border border-amber-500/40 p-3 rounded-lg flex-1 min-w-[120px]">
                  <span className="text-amber-400 font-bold block">Exam Blueprint</span>
                  <span className="text-slate-300 text-[11px]">EXAM-NEET-2026</span>
                  <span className="text-[10px] text-slate-500 block">Set A Variant</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                <div className="bg-slate-900 border border-rose-500/40 p-3 rounded-lg flex-1 min-w-[120px]">
                  <span className="text-rose-400 font-bold block">Leaked Node</span>
                  <span className="text-slate-300 text-[11px]">Telegram EVID-902</span>
                  <span className="text-[10px] text-rose-400 font-bold block">89% Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
