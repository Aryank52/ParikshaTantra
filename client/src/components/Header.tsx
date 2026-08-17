import React from 'react';
import { Shield, Lock, Wifi, AlertTriangle, UserCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { user, demoUsers, switchUser, wsConnected, logout, securityNotice, clearNotice } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-40 px-6 py-3 flex items-center justify-between shadow-2xl border-b border-slate-800">
      {/* Brand Title & Emblem */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6 text-blue-300" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-blue-200 via-indigo-100 to-amber-200 bg-clip-text text-transparent">
              PARIKSHATANTRA
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ZERO-TRUST V2.4
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Secure National Examination & Anti-Leak Infrastructure</p>
        </div>
      </div>

      {/* Security Alerts Banner */}
      {securityNotice && (
        <div className="hidden md:flex items-center space-x-3 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-1.5 rounded-lg text-xs animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-semibold">{securityNotice}</span>
          <button onClick={clearNotice} className="text-red-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Connection & Persona Switcher */}
      <div className="flex items-center space-x-4">
        {/* Real-time WS Status */}
        <div className="flex items-center space-x-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-mono">
          <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
          <span className={wsConnected ? 'text-emerald-300' : 'text-red-400'}>
            {wsConnected ? 'SECURE WS LIVE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Demo Persona Role Switcher */}
        {user ? (
          <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200">{user.fullName}</div>
              <div className="text-[10px] font-mono text-amber-400 font-semibold">{user.role}</div>
            </div>

            <select
              className="bg-slate-800 text-xs text-slate-200 font-mono border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
              value={user.username}
              onChange={(e) => switchUser(e.target.value)}
              title="Switch Demo Persona / Role"
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
            <span>Unauthenticated Sandbox</span>
          </div>
        )}
      </div>
    </header>
  );
};
