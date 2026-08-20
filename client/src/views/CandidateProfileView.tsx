import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  FileCheck,
  Building,
  Award,
  CheckCircle,
  Clock,
  Key,
  Lock,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewType } from '../components/Sidebar';

interface CandidateProfileViewProps {
  onNavigate: (view: ViewType) => void;
}

export const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const candidateData = {
    fullName: user?.fullName || 'Aryan Kumar',
    email: user?.email || 'aryan.candidate@parikshatantra.gov.in',
    phone: '+91 98765 43210',
    candidateCode: user?.candidateCode || 'CAND-2026-88412',
    identityPseudonymHash: '0x8f7a9d2c4e1b3a5f9c7d8e2b4a6f0c1d3e5f7a9b',
    category: 'GENERAL',
    dob: '15/08/2001',
    qualification: 'Bachelor of Technology (Computer Science)',
    disabilityStatus: 'NO (STANDARD TERMINAL ALLOCATION)',
    allocatedCentre: 'Kendriya Vidyalaya No. 1, R.K. Puram, New Delhi',
    allocatedLabNode: 'Terminal Node 14B',
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 font-sans text-slate-100 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>Candidate Profile & Security Identity</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verified Pseudonymized Government ID Record • ParikshaTantra Candidate Governance
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center space-x-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>IDENTITY VERIFIED</span>
        </span>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-3 rounded-lg text-xs font-mono flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Profile contact preferences updated successfully.</span>
        </div>
      )}

      {/* Main Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Summary (1 col) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-950 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-2xl font-mono">
              {candidateData.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{candidateData.fullName}</h2>
              <p className="text-xs text-slate-400 font-mono">{candidateData.candidateCode}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="text-amber-400 font-bold">{candidateData.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DOB:</span>
              <span className="text-slate-200">{candidateData.dob}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Node Allocated:</span>
              <span className="text-indigo-400 font-bold">{candidateData.allocatedLabNode}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Cryptographic Pseudonym Hash:</div>
            <div className="text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 break-all">
              {candidateData.identityPseudonymHash}
            </div>
          </div>
        </div>

        {/* Details Form (2 cols) */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5">
          <h3 className="font-mono text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
            PERSONAL & ACADEMIC REGISTRATION DATA
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  disabled
                  value={candidateData.fullName}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={candidateData.email}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Contact Phone</label>
                <input
                  type="text"
                  defaultValue={candidateData.phone}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Educational Qualification</label>
                <input
                  type="text"
                  disabled
                  value={candidateData.qualification}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 font-mono text-xs text-blue-400 font-bold">
                <Building className="w-4 h-4" />
                <span>ALLOCATED TEST CENTRE LOCATION</span>
              </div>
              <p className="text-slate-200 font-semibold">{candidateData.allocatedCentre}</p>
              <div className="text-[11px] text-slate-400 font-mono">
                Assigned Terminal: <span className="text-indigo-400 font-bold">{candidateData.allocatedLabNode}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onNavigate('DEVICE_CHECK')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Run Hardware Test
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-colors"
              >
                Save Contact Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
