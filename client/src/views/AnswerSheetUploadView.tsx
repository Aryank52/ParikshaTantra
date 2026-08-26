import React, { useState, useEffect } from 'react';
import { FileUp, FileCheck2, UploadCloud, CheckCircle2, ShieldCheck, Hash, Search, Shield, ArrowRight } from 'lucide-react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AnswerSheetUploadView: React.FC = () => {
  const { user, token, switchUser } = useAuth();
  const [examCode, setExamCode] = useState('EXAM-NEET-2026');
  const [centreCode, setCentreCode] = useState('CENTRE-DELHI-01');
  const [candidateRoll, setCandidateRoll] = useState('2026-NEET-99481');
  const [shiftCode, setShiftCode] = useState('SHIFT-1');
  const [uploader, setUploader] = useState('CENTRE_SUPERINTENDENT');
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [recentScans, setRecentScans] = useState<any[]>([]);

  const loadScans = async () => {
    if (!token) return;
    try {
      const data = await fetchApi('/paper/sheets');
      setRecentScans(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && token) {
      loadScans();
    }
  }, [user, token]);

  if (!user || !token) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <FileUp className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100">AUTHENTICATION REQUIRED FOR OMR SCAN WORKBENCH</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tamper-evident OMR and descriptive physical answer sheet uploads require authenticated Centre Superintendent credentials.
          </p>
          <button
            onClick={() => switchUser('centre_admin')}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 inline-flex items-center space-x-2 transition-all"
          >
            <span>Authenticate as Centre Official</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleUploadSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const data = await fetchApi('/paper/upload-answer-sheet', {
        method: 'POST',
        body: JSON.stringify({
          examCode,
          centreCode,
          candidateRoll,
          shiftCode,
          base64SheetData: `OMR_RAW_DATA_BLOB_${candidateRoll}_${Date.now()}`,
          uploader,
        }),
      });

      setSuccessMsg(`Sheet ${data.scan.scanCode} registered! Evaluation Score: ${data.scan.evaluatedScore}/100`);
      loadScans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload answer sheet scan');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="gov-panel p-6 border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-950 border border-blue-500/30 rounded-xl text-blue-400">
            <FileUp className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-slate-100">
              PAPER & HYBRID Exam Mode — Answer Sheet Upload Desk
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Secure scanned OMR sheet registration, file hashing, and automated evaluation queue for physical paper examinations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <form onSubmit={handleUploadSheet} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>Upload OMR Sheet Scan</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">EXAMINATION CODE</label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">CENTRE CODE</label>
              <input
                type="text"
                value={centreCode}
                onChange={(e) => setCentreCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">CANDIDATE ROLL NUMBER</label>
              <input
                type="text"
                value={candidateRoll}
                onChange={(e) => setCandidateRoll(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">SHIFT CODE</label>
              <select
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-bold"
              >
                <option value="SHIFT-1">Shift 1 (09:30 AM - 12:30 PM)</option>
                <option value="SHIFT-2">Shift 2 (02:30 PM - 05:30 PM)</option>
              </select>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg font-mono">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            {isUploading ? 'REGISTERING SCAN & OMR EVALUATION...' : 'REGISTER SCANNED OMR SHEET'}
          </button>
        </form>

        {/* Recent Scans Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Recently Uploaded Answer Sheets</span>
          </h3>

          <div className="space-y-3 font-mono text-xs overflow-y-auto max-h-[340px]">
            {recentScans.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No answer sheet uploads recorded yet.</div>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-200">
                    <span>{scan.scanCode}</span>
                    <span className="text-emerald-400">{scan.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Roll: <strong className="text-slate-200">{scan.candidateRoll}</strong></span>
                    <span>Score: <strong className="text-amber-300">{scan.evaluatedScore || 'N/A'}</strong></span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Hash: {scan.fileHash}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
