import React from 'react';
import { Shield, Search, UserPlus, LogIn, CheckCircle2, Lock, ArrowRight, Activity, Building2, FileCheck2, Award } from 'lucide-react';
import { ViewType } from '../components/Sidebar';

interface NationalLandingPageProps {
  onNavigate: (view: ViewType) => void;
}

export const NationalLandingPage: React.FC<NationalLandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      {/* Hero Header */}
      <div className="gov-panel p-8 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-mono font-semibold">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>OFFICIAL PUBLIC DIGITAL INFRASTRUCTURE</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white font-mono">
            PARIKSHATANTRA
            <span className="block text-2xl font-sans text-slate-300 font-normal mt-1">
              National Examination & Anti-Leak Infrastructure
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            One unified, zero-trust digital ecosystem for examination registration, eligibility evaluation, secure centre allocation, admit card generation, just-in-time encrypted CBT delivery, tamper-evident audit logging, and public result verification.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('EXAM_CATALOG')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono rounded flex items-center space-x-2 transition-all shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>FIND EXAMINATION CATALOG</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('CBT_PORTAL')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded flex items-center space-x-2 transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>CANDIDATE CBT & REGISTRATION</span>
            </button>

            <button
              onClick={() => onNavigate('CERTIFICATE_VERIFY')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono rounded flex items-center space-x-2 transition-all"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>VERIFY CERTIFICATE / QR</span>
            </button>

            <button
              onClick={() => onNavigate('AUTHORITY_PORTAL')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold font-mono rounded flex items-center space-x-2 transition-all"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>AUTHORITY VAULT PORTAL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Security & Architecture Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="gov-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>EXAM AUTHORITIES</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">12 PSCs & Boards</div>
          <p className="text-[11px] text-slate-400">NTA, UPSC, SSC, IBPS, MPSC, UPPSC, BPSC, WBPSC, KPSC, TSPSC</p>
        </div>

        <div className="gov-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TESTING HUBS SEEDED</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">25+ Cities / Districts</div>
          <p className="text-[11px] text-slate-400">Landmark TCS iON Digital Zones & NTA Cyber Hubs</p>
        </div>

        <div className="gov-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>QUESTION VAULT SECURITY</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">AES-256-GCM</div>
          <p className="text-[11px] text-slate-400">Dual 4-Eyes Approval & JIT Question Delivery</p>
        </div>

        <div className="gov-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AUDIT INTEGRITY</span>
            <FileCheck2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">SHA-256 Ledger</div>
          <p className="text-[11px] text-slate-400">Tamper-Evident Hash Chain Event Logging</p>
        </div>
      </div>

      {/* Ecosystem Portals Overview Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span>Unified Examination Operating Ecosystem</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gov-panel p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">1</div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">Public Exam Catalog & Search</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search live Central and State recruitment examinations, eligibility requirements, syllabus overview, fee structure, and official authority source links.
            </p>
            <button
              onClick={() => onNavigate('EXAM_CATALOG')}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono font-bold flex items-center space-x-1 pt-1"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="gov-panel p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">2</div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">Candidate CBT & Admit Cards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rules-based eligibility evaluation, application submission, admit card generation with seat node allocation, and secure CBT exam interface.
            </p>
            <button
              onClick={() => onNavigate('CBT_PORTAL')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center space-x-1 pt-1"
            >
              <span>Enter CBT Lobby</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="gov-panel p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">3</div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">SOC & Threat Command Centre</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time GIS map markers across 25+ Indian cities, AI anomaly scoring, semantic leak detection, insider threat analytics, and emergency freeze controls.
            </p>
            <button
              onClick={() => onNavigate('SOC_OPERATIONS')}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono font-bold flex items-center space-x-1 pt-1"
            >
              <span>Open SOC Telemetry</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Security Disclaimer Notice */}
      <div className="p-4 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono flex items-center space-x-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <span className="text-slate-200 font-bold">Zero-Trust Security Position: </span>
          ParikshaTantra enforces Defense-in-Depth, Cryptographic Integrity, Least Privilege, and Compromise Detection. No individual person, terminal node, or testing center is automatically trusted without cryptographic authentication.
        </div>
      </div>
    </div>
  );
};
