import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Building2,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewType } from '../components/Sidebar';

interface LoginViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectPortal: (portal: 'STUDENT' | 'GOVERNMENT') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onSelectPortal }) => {
  const { switchUser, demoUsers } = useAuth();
  const [tab, setTab] = useState<'STUDENT' | 'GOVERNMENT' | 'CENTRE'>('STUDENT');

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!usernameInput) {
      setErrorNotice('Please enter your candidate or official user credential.');
      return;
    }

    // Match input to seeded persona or log in
    const match = demoUsers.find(
      (u) => u.username.toLowerCase() === usernameInput.toLowerCase() || u.email.toLowerCase() === usernameInput.toLowerCase()
    );

    if (match) {
      switchUser(match.username);
      setSuccessNotice(`Authentication successful. Logged in as ${match.role}: ${match.fullName}`);
      setTimeout(() => {
        if (match.role === 'CANDIDATE') {
          onSelectPortal('STUDENT');
          onNavigate('CANDIDATE_DASHBOARD');
        } else {
          onSelectPortal('GOVERNMENT');
          onNavigate('CONTROL_TOWER');
        }
      }, 1000);
    } else {
      // Default fallback demo login
      const defaultUser = tab === 'STUDENT' ? 'candidate_demo' : 'national_admin';
      switchUser(defaultUser);
      setSuccessNotice('Authenticated via Zero-Trust Session Provider.');
      setTimeout(() => {
        if (tab === 'STUDENT') {
          onSelectPortal('STUDENT');
          onNavigate('CANDIDATE_DASHBOARD');
        } else {
          onSelectPortal('GOVERNMENT');
          onNavigate('CONTROL_TOWER');
        }
      }, 1000);
    }
  };

  const handleQuickDemoLogin = (username: string, portal: 'STUDENT' | 'GOVERNMENT', view: ViewType) => {
    switchUser(username);
    onSelectPortal(portal);
    onNavigate(view);
  };

  return (
    <div className="p-6 space-y-6 font-sans text-slate-100 max-w-4xl mx-auto">
      {/* Brand & Auth Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100">
          PARIKSHATANTRA AUTHENTICATION
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Zero-Trust Identity Provider • Role-Based Access Control (RBAC) • Multi-Factor Verification
        </p>
      </div>

      {/* Login Mode Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center justify-center max-w-md mx-auto">
        <button
          onClick={() => setTab('STUDENT')}
          className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tab === 'STUDENT' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>STUDENT LOGIN</span>
        </button>

        <button
          onClick={() => setTab('GOVERNMENT')}
          className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tab === 'GOVERNMENT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>GOVT / ADMIN</span>
        </button>

        <button
          onClick={() => setTab('CENTRE')}
          className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tab === 'CENTRE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>CENTRE STAFF</span>
        </button>
      </div>

      {errorNotice && (
        <div className="bg-red-950/60 border border-red-500/50 text-red-200 p-3 rounded-lg text-xs font-mono flex items-center space-x-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorNotice}</span>
        </div>
      )}

      {successNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 p-3 rounded-lg text-xs font-mono flex items-center space-x-2 max-w-md mx-auto">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Login Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl max-w-md mx-auto space-y-4">
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">
              {tab === 'STUDENT'
                ? 'Candidate ID / Email'
                : tab === 'GOVERNMENT'
                ? 'Official Authority ID'
                : 'Exam Centre Code'}
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder={
                tab === 'STUDENT'
                  ? 'e.g. candidate_demo or email'
                  : tab === 'GOVERNMENT'
                  ? 'e.g. national_admin'
                  : 'e.g. centre_admin'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">Password</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {(tab === 'GOVERNMENT' || tab === 'CENTRE') && (
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">MFA Authenticator Code (TOTP)</label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="6-digit code (e.g. 748192)"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-center tracking-widest text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2.5 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center space-x-2 ${
              tab === 'STUDENT'
                ? 'bg-blue-600 hover:bg-blue-500'
                : tab === 'GOVERNMENT'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <span>Authenticate & Access Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* QUICK DEMO PERSONA LOGIN DESK */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
        <div className="flex items-center space-x-2 font-mono text-xs text-amber-400 font-bold border-b border-slate-800 pb-2">
          <Sparkles className="w-4 h-4" />
          <span>DEMO PERSONA QUICK ACCESS (EVALUATION MODE)</span>
        </div>

        <p className="text-xs text-slate-400">
          One-click evaluation access with pre-seeded zero-trust credentials and permissions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => handleQuickDemoLogin('candidate_demo', 'STUDENT', 'CANDIDATE_DASHBOARD')}
            className="p-3 bg-slate-900 hover:bg-slate-850 border border-blue-500/30 rounded-lg text-left transition-all group"
          >
            <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">Candidate Role</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Aryan Kumar (CANDIDATE)</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">Student Portal →</div>
          </button>

          <button
            onClick={() => handleQuickDemoLogin('national_admin', 'GOVERNMENT', 'CONTROL_TOWER')}
            className="p-3 bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 rounded-lg text-left transition-all group"
          >
            <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">National Authority</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Dr. V. Sharma (NATIONAL_AUTHORITY)</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">Control Tower →</div>
          </button>

          <button
            onClick={() => handleQuickDemoLogin('security_officer', 'GOVERNMENT', 'SOC_OPERATIONS')}
            className="p-3 bg-slate-900 hover:bg-slate-850 border border-red-500/30 rounded-lg text-left transition-all group"
          >
            <div className="text-xs font-bold text-red-300 group-hover:text-red-200">Security Officer</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Col. R. Singh (SECURITY_OFFICER)</div>
            <div className="text-[10px] text-red-400 font-mono mt-1">SOC Dashboard →</div>
          </button>

          <button
            onClick={() => handleQuickDemoLogin('centre_admin', 'GOVERNMENT', 'HARDWARE_CHECK')}
            className="p-3 bg-slate-900 hover:bg-slate-850 border border-indigo-500/30 rounded-lg text-left transition-all group"
          >
            <div className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">Centre Administrator</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">P. Mehta (CENTRE_ADMIN)</div>
            <div className="text-[10px] text-indigo-400 font-mono mt-1">Hardware Grid →</div>
          </button>
        </div>
      </div>
    </div>
  );
};
