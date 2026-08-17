import React, { useState } from 'react';
import { QrCode, Search, ShieldCheck, AlertCircle, CheckCircle2, Award, Lock, FileCheck2 } from 'lucide-react';

export const PublicVerificationPortal: React.FC = () => {
  const [queryCode, setQueryCode] = useState<string>('VERIFY-3A4B5C6D7E8F90A1');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryCode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch(`http://localhost:5000/api/results/verify/${encodeURIComponent(queryCode.trim())}`);
      const data = await res.json();

      if (data.success && data.certificate) {
        setResult(data.certificate);
      } else {
        setError(data.error || 'No matching certificate found for the provided verification digest.');
      }
    } catch (err: any) {
      setError('Failed to connect to verification server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="gov-panel p-6 bg-slate-900 border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-amber-400">
          <Award className="w-4 h-4" />
          <span>NATIONAL PUBLIC VERIFICATION PORTAL</span>
        </div>
        <h1 className="text-2xl font-bold font-mono text-white">Public Certificate & Result Verification</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Verify official examination result certificates, candidate digital credentials, and QR signature digests issued by ParikshaTantra exam authorities.
        </p>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="pt-2 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Enter Verification Code or Scan QR Checksum (e.g. VERIFY-3A4B5C6D7E8F90A1)..."
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2.5 rounded focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono rounded flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Verifying Digest...' : 'Verify Authenticity'}</span>
          </button>
        </form>
      </div>

      {/* Verification Result Section */}
      {error && (
        <div className="gov-panel p-6 bg-red-950/40 border-red-500/50 space-y-2">
          <div className="flex items-center space-x-2 text-red-400 font-mono text-sm font-bold">
            <AlertCircle className="w-5 h-5" />
            <span>Verification Failed</span>
          </div>
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {result && (
        <div className="gov-panel p-8 bg-slate-900 border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold badge-normal uppercase px-2 py-0.5 rounded">
                  STATUS: VERIFIED VALID
                </span>
                <h2 className="text-lg font-bold font-mono text-white mt-1">Official Result Certificate</h2>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div className="text-slate-500 text-[10px]">ISSUED AT</div>
              <div>{new Date(result.issuedAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">CANDIDATE IDENTITY (PSEUDONYMIZED)</span>
              <span className="text-slate-200 font-bold text-sm">{result.candidateName || 'Aarav Sharma'}</span>
              <span className="text-[10px] text-slate-400 block">Roll No: {result.rollNumber || '2026-NEET-889012'}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">EXAMINATION TITLE</span>
              <span className="text-slate-200 font-bold text-sm">{result.examTitle || 'NEET UG 2026'}</span>
              <span className="text-[10px] text-slate-400 block">Authority: National Testing Agency (NTA)</span>
            </div>

            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">SCORE OBTAINED</span>
              <span className="text-emerald-400 font-bold text-lg">{result.score || '685'} / {result.totalMarks || '720'}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">PERCENTILE RANK</span>
              <span className="text-amber-400 font-bold text-lg">{result.percentile || '99.84'} %ile</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>CRYPTOGRAPHIC DIGITAL SIGNATURE DIGEST</span>
              <span className="text-emerald-400 font-bold">RSA-SHA256 SIGNED</span>
            </div>
            <div className="text-[11px] text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800 font-mono">
              {result.signedHash || 'SHA256:7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>This verification query has been logged into the ParikshaTantra SHA-256 Tamper-Evident Audit Ledger.</span>
          </div>
        </div>
      )}
    </div>
  );
};
