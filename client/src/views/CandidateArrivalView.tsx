import React, { useState } from 'react';
import { 
  UserCheck, QrCode, Search, ShieldCheck, CheckCircle2, AlertCircle, 
  MapPin, User, Cpu, ArrowRight, FileText, Check
} from 'lucide-react';
import { api } from '../services/api';

export const CandidateArrivalView: React.FC = () => {
  const [candidateCode, setCandidateCode] = useState<string>('CAND-1001');
  const [candidateData, setCandidateData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [assignedNode, setAssignedNode] = useState<string>('Terminal Node 14B');
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSearchAdmitCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateCode) return;
    setLoading(true);
    setError('');
    setCandidateData(null);
    setVerifiedSuccess(false);
    try {
      const data = await api.get(`/candidate/admit-card/${candidateCode.trim().toUpperCase()}`);
      setCandidateData(data);
    } catch (err: any) {
      setError(err.message || 'Admit Card or Candidate Record Not Found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCandidate = async (status: string) => {
    if (!candidateData) return;
    setLoading(true);
    try {
      const res = await api.post('/candidate/verify-attendance', {
        candidateCode: candidateData.candidateCode,
        terminalNode: assignedNode,
        status,
      });
      setVerifiedSuccess(true);
      setStatusMessage(`✅ Candidate ${candidateData.fullName} verified & admitted to ${assignedNode}.`);
    } catch (err: any) {
      setError(err.message || 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl flex items-center space-x-4">
        <UserCheck className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">PHYSICAL CANDIDATE ARRIVAL & ADMITTANCE WORKFLOW</h1>
          <p className="text-slate-400 text-sm">Centre Entry Desk: Admit Card Scanner, Identity Verification & Terminal Node Assignment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Scan Admit Card / Roll No</h2>
          </div>

          <form onSubmit={handleSearchAdmitCard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Candidate Code / Roll Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CAND-1001"
                  value={candidateCode}
                  onChange={(e) => setCandidateCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-sm rounded-md pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-cyan-500 uppercase"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !candidateCode}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-md transition flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>FETCH ADMIT CARD RECORD</span>
            </button>
          </form>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-md text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Selector */}
          <div className="border-t border-slate-800 pt-4">
            <span className="text-xs text-slate-500 block mb-2 font-mono">Sample Candidate Codes:</span>
            <div className="flex flex-wrap gap-2">
              {['CAND-1001', 'CAND-1002', 'CAND-1003'].map((code) => (
                <button
                  key={code}
                  onClick={() => { setCandidateCode(code); }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono rounded border border-slate-700"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate Admit Card Verification Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          {candidateData ? (
            <>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 font-bold">
                    {candidateData.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{candidateData.fullName}</h2>
                    <span className="text-xs font-mono text-cyan-400">Roll No: {candidateData.rollNumber}</span>
                  </div>
                </div>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded font-bold">
                  ELIGIBLE & VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/60 p-3.5 rounded border border-slate-700 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Category:</span>
                    <span className="text-slate-200 font-semibold">{candidateData.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Pseudonym Identity Hash:</span>
                    <span className="text-cyan-300 font-mono">{candidateData.identityHash.substring(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Admit Card Checksum:</span>
                    <span className="text-emerald-400 font-mono">{candidateData.admitCardSignedChecksum.substring(0, 14)}...</span>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded border border-slate-700 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Allocated Centre:</span>
                    <span className="text-slate-200 font-semibold">{candidateData.allocatedCentre?.name || 'Central Test Centre 01'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Location:</span>
                    <span className="text-slate-300">{candidateData.allocatedCentre?.district}, {candidateData.allocatedCentre?.state}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned Terminal Node:</span>
                    <span className="text-purple-400 font-bold font-mono">{assignedNode}</span>
                  </div>
                </div>
              </div>

              {/* Node Assignment & Action */}
              <div className="bg-slate-950 border border-slate-800 rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-slate-400">
                    Assign Terminal Lab Node:
                  </label>
                  <select
                    value={assignedNode}
                    onChange={(e) => setAssignedNode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono rounded px-3 py-1.5"
                  >
                    <option value="Terminal Node 14B">Lab 1 - Terminal Node 14B</option>
                    <option value="Terminal Node 15A">Lab 1 - Terminal Node 15A</option>
                    <option value="Terminal Node 18C">Lab 2 - Terminal Node 18C</option>
                    <option value="Terminal Node 22A">Lab 3 - Terminal Node 22A</option>
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleVerifyCandidate('VERIFIED')}
                    disabled={loading || verifiedSuccess}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-md transition flex items-center justify-center space-x-2 text-sm shadow-lg shadow-emerald-950"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MARK PRESENT & ADMIT TO LOBBY</span>
                  </button>
                </div>

                {statusMessage && (
                  <div className="p-3 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-mono rounded text-center">
                    {statusMessage}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <FileText className="w-12 h-12 text-slate-700" />
              <p className="text-sm">Scan or enter Candidate Code on the left to verify admit card and assign terminal seat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
