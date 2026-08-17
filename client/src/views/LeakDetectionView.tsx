import { useState } from 'react';
import { FileSearch, AlertTriangle, ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../services/api';

export const LeakDetectionView: React.FC = () => {
  const [title, setTitle] = useState('Suspected Paper Leak Snippet Upload');
  const [source, setSource] = useState('SCREENSHOT');
  const [textContent, setTextContent] = useState('Solve the differential equation dy/dx + P(x)y = Q(x) and determine the integrating factor');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchApi('/leak/analyze', {
        method: 'POST',
        body: JSON.stringify({
          title,
          source,
          textContent,
        }),
      });
      setAnalysisResult(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <FileSearch className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">AI Semantic Paper Leak Detection Engine</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
                TF-IDF & COSINE SIMILARITY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upload Suspected Evidence • OCR Normalization • Question Bank Similarity Search
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono">EVIDENCE UPLOAD & OCR ANALYSIS PIPELINE</h3>

          <form onSubmit={handleRunAnalysis} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400">Evidence Title</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 mt-1 font-sans"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-slate-400">Evidence Source</label>
              <select
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-purple-500 mt-1"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="SCREENSHOT">SCREENSHOT / IMAGE</option>
                <option value="TELEGRAM">TELEGRAM / MESSAGING CHANNEL</option>
                <option value="SOCIAL_MEDIA">SOCIAL MEDIA POST</option>
                <option value="PHYSICAL_PAPER">PHYSICAL LEAK PRINT</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Extracted Text Snippet (or OCR Output)</label>
              <textarea
                rows={5}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 mt-1 font-mono text-xs"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Analyzing Semantic Hashes...' : 'Run Leak Detection Pipeline'}</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono">SIMILARITY MATCH ANALYSIS OUTPUT</h3>

          {analysisResult ? (
            <div className="space-y-4">
              {analysisResult.topMatch ? (
                <div className="p-5 bg-red-950/20 border border-red-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-red-300 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>POTENTIAL LEAK MATCH DETECTED</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded font-extrabold bg-red-500/20 text-red-400 border border-red-500/40">
                      {analysisResult.topMatch.similarityScore}% MATCH
                    </span>
                  </div>

                  <div className="text-xs font-mono space-y-1 text-slate-300">
                    <div>Question Code: <strong className="text-amber-400">{analysisResult.topMatch.questionCode}</strong></div>
                    <div>Subject: <strong className="text-slate-200">{analysisResult.topMatch.subject}</strong></div>
                    <div>Risk Classification: <strong className="text-red-400">{analysisResult.topMatch.riskLevel}</strong></div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-400">
                    Snippet: {analysisResult.topMatch.matchedSnippet}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-emerald-300">No Significant Question Matches Found</div>
                  <p className="text-[11px] text-slate-400">Uploaded content similarity score is below the 25% risk threshold.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 font-mono">
              Upload evidence on the left to execute the AI similarity match pipeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
