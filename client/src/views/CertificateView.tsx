import { useState } from 'react';
import { QrCode, ShieldCheck, CheckCircle2, AlertOctagon, Search } from 'lucide-react';
import { fetchApi } from '../services/api';

export const CertificateView: React.FC = () => {
  const [qrInput, setQrInput] = useState('VERIFY-3A4B5C6D7E8F90A1');
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchApi(`/results/verify/${qrInput}`);
      setCertData(data);
    } catch (err: any) {
      setError(err.message || 'Verification code invalid');
      setCertData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-xl">
          <QrCode className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Public Examination Certificate QR Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Official Public Verification Portal for National & State Examination Certificates
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="flex space-x-2 max-w-md mx-auto pt-2">
          <input
            type="text"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono font-bold uppercase text-slate-100 focus:outline-none focus:border-blue-500 tracking-wider"
            placeholder="Enter QR Verification Code (VERIFY-...)"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Verify</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {certData && (
        <div className="glass-panel p-8 rounded-2xl border border-emerald-500/40 space-y-6 shadow-2xl bg-emerald-950/10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="text-base font-extrabold text-slate-100">{certData.verificationStatus}</h3>
                <span className="text-xs text-slate-400 font-mono">Certificate: {certData.certificateNumber}</span>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono font-bold">
              RSA-SHA256 SIGNATURE VALID
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400">Candidate Name</div>
              <div className="text-sm font-bold text-slate-100 font-sans mt-1">{certData.candidateName}</div>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400">Issuing Authority</div>
              <div className="text-sm font-bold text-slate-100 font-sans mt-1">{certData.authorityName}</div>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400">Examination Title</div>
              <div className="text-slate-200 font-sans mt-1">{certData.examTitle} ({certData.examCode})</div>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400">Score & Percentile</div>
              <div className="text-emerald-400 font-bold mt-1">Score: {certData.score} | Percentile: {certData.percentile}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
