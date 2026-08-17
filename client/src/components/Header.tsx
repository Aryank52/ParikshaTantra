import React from 'react';
import { Shield, Lock, Wifi, AlertTriangle, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { user, demoUsers, switchUser, wsConnected, logout, securityNotice, clearNotice } = useAuth();

  return (
    <header className="gov-panel sticky top-0 z-40 px-6 py-3 flex flex-col space-y-2 border-b border-slate-800 rounded-none shadow-md">
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
                ZERO-TRUST OPERATING SYSTEM
              </span>
            </div>
            <p className="text-xs text-slate-400">National Examination & Anti-Leak Infrastructure • Government of India</p>
          </div>
        </div>

        {/* Security Alerts Banner */}
        {securityNotice && (
          <div className="hidden md:flex items-center space-x-3 bg-red-950/60 border border-red-500/50 text-red-200 px-3 py-1 rounded text-xs animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-semibold">{securityNotice}</span>
            <button onClick={clearNotice} className="text-red-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Connection & Persona Switcher */}
        <div className="flex items-center space-x-4">
          {/* Real-time WS Status */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded text-xs font-mono">
            <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>
              {wsConnected ? 'SECURE WS LIVE' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Demo Persona Role Switcher */}
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-700 px-3 py-1 rounded">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{user.fullName}</div>
                <div className="text-[10px] font-mono text-amber-400 font-semibold">{user.role}</div>
              </div>

              <select
                className="bg-slate-800 text-xs text-slate-200 font-mono border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                value={user.username}
                onChange={(e) => switchUser(e.target.value)}
                title="Switch Role / Persona"
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

      {/* Official Notice Ticker */}
      <div className="flex items-center justify-between bg-slate-950 px-3 py-1 rounded text-[11px] font-mono border border-slate-800/80 text-slate-300">
        <div className="flex items-center space-x-2 overflow-hidden">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex-shrink-0">Official Bulletin:</span>
          <span className="truncate text-slate-400">All examination centres must enforce dual 4-eyes vault authorization before shift release • JIT Question delivery active via AES-256-GCM.</span>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>CRYPTOGRAPHIC HASH CHAIN VERIFIED</span>
        </div>
      </div>
    </header>
  );
};
