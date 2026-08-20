import React from 'react';
import { Shield, Lock, Wifi, AlertTriangle, LogOut, CheckCircle2, User, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  portalMode: 'STUDENT' | 'GOVERNMENT';
  onTogglePortal: (mode: 'STUDENT' | 'GOVERNMENT') => void;
  onOpenAiAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({ portalMode, onTogglePortal, onOpenAiAssistant }) => {
  const { user, demoUsers, switchUser, wsConnected, logout, securityNotice, clearNotice } = useAuth();

  return (
    <header className="gov-panel sticky top-0 z-40 px-6 py-2.5 flex flex-col space-y-2 border-b border-slate-800 rounded-none shadow-md bg-slate-950">
      <div className="flex items-center justify-between">
        {/* Brand Title & Emblem */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-slate-900 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold tracking-wider text-slate-100 font-mono">
                PARIKSHATANTRA
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold badge-normal">
                ZERO-TRUST OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">National Examination & Anti-Leak Infrastructure • Govt of India</p>
          </div>
        </div>

        {/* PORTAL TOGGLE SWITCH (STUDENT VS GOVERNMENT) */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => onTogglePortal('STUDENT')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              portalMode === 'STUDENT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>STUDENT PORTAL</span>
          </button>

          <button
            onClick={() => onTogglePortal('GOVERNMENT')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              portalMode === 'GOVERNMENT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>GOVERNMENT / ADMIN</span>
          </button>
        </div>

        {/* Security Alerts Banner */}
        {securityNotice && (
          <div className="hidden xl:flex items-center space-x-2 bg-red-950/60 border border-red-500/50 text-red-200 px-3 py-1 rounded text-xs animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-semibold">{securityNotice}</span>
            <button onClick={clearNotice} className="text-red-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Connection, Persona Switcher & AI Assistant Trigger */}
        <div className="flex items-center space-x-3">
          {/* AI Copilot Quick Launch */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center space-x-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800 hover:to-indigo-800 text-blue-200 border border-blue-500/40 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pariksha AI</span>
          </button>

          {/* Real-time WS Status */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-xs font-mono">
            <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className={wsConnected ? 'text-emerald-400 font-semibold' : 'text-red-400'}>
              {wsConnected ? 'WS LIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* Persona Switcher */}
          {user ? (
            <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200">{user.fullName}</div>
                <div className="text-[10px] font-mono text-amber-400 font-semibold">{user.role}</div>
              </div>

              <select
                className="bg-slate-800 text-xs text-slate-200 font-mono border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                value={user.username}
                onChange={(e) => switchUser(e.target.value)}
                title="Switch Persona Role"
              >
                {demoUsers.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.role}: {u.fullName}
                  </option>
                ))}
              </select>

              <button
                onClick={logout}
                title="Sign Out"
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Sandbox Access</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticker Bulletin */}
      <div className="flex items-center justify-between bg-slate-900 px-3 py-1 rounded text-[11px] font-mono border border-slate-800 text-slate-300">
        <div className="flex items-center space-x-2 overflow-hidden">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex-shrink-0">Official Ticker:</span>
          <span className="truncate text-slate-400">
            {portalMode === 'STUDENT'
              ? 'Candidate registrations active for UPSC CSE, NTA NEET-UG & SSC CGL • Verify Admit Card QR before entering test node.'
              : 'All 28 State & District Examination Controllers online • 4-Eyes Question Vault approvals verified via AES-256-GCM.'}
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-2 flex-shrink-0 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ZERO-TRUST MODEL ACTIVE</span>
        </div>
      </div>
    </header>
  );
};
