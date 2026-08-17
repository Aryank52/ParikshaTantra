import React from 'react';
import {
  Monitor,
  Vault,
  Building2,
  Landmark,
  Activity,
  FileSearch,
  UserX,
  FileCheck2,
  Zap,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ViewType =
  | 'CBT_PORTAL'
  | 'AUTHORITY_PORTAL'
  | 'STATE_DISTRICT'
  | 'CENTRE_PORTAL'
  | 'SOC_OPERATIONS'
  | 'LEAK_DETECTION'
  | 'INSIDER_THREAT'
  | 'AUDIT_LEDGER'
  | 'ATTACK_SIMULATOR'
  | 'CERTIFICATE_VERIFY';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { user } = useAuth();

  const navItems: { id: ViewType; label: string; icon: any; category: string; badge?: string }[] = [
    { id: 'CBT_PORTAL', label: 'Candidate CBT Engine', icon: Monitor, category: 'EXAMINATION', badge: 'JIT' },
    { id: 'AUTHORITY_PORTAL', label: 'Question Vault & Blueprint', icon: Vault, category: 'AUTHORITY' },
    { id: 'STATE_DISTRICT', label: 'State & District Governance', icon: Landmark, category: 'AUTHORITY' },
    { id: 'CENTRE_PORTAL', label: 'Centre Network & Activation', icon: Building2, category: 'AUTHORITY' },
    { id: 'SOC_OPERATIONS', label: 'Security Command Centre', icon: Activity, category: 'SECURITY', badge: 'SOC' },
    { id: 'LEAK_DETECTION', label: 'Semantic Leak Matcher', icon: FileSearch, category: 'SECURITY', badge: 'AI' },
    { id: 'INSIDER_THREAT', label: 'AI Threat & Anomaly Engine', icon: UserX, category: 'SECURITY', badge: 'AI' },
    { id: 'AUDIT_LEDGER', label: 'Hash-Chain Audit Verifier', icon: FileCheck2, category: 'FORENSICS' },
    { id: 'ATTACK_SIMULATOR', label: 'Attack Simulator (Judge Demo)', icon: Zap, category: 'DEMO', badge: '7 DEMOS' },
    { id: 'CERTIFICATE_VERIFY', label: 'QR Certificate Verification', icon: QrCode, category: 'VERIFICATION' },
  ];

  return (
    <aside className="w-64 bg-gov-dark/95 border-r border-slate-800 p-4 flex flex-col justify-between h-[calc(100vh-61px)] font-sans">
      <div className="space-y-6">
        {['EXAMINATION', 'AUTHORITY', 'SECURITY', 'FORENSICS', 'DEMO', 'VERIFICATION'].map((category) => {
          const categoryItems = navItems.filter((i) => i.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <h2 className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase px-3 mb-2">
                {category} MODULES
              </h2>
              {categoryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          item.id === 'ATTACK_SIMULATOR'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-400 font-semibold font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ZERO-TRUST ENFORCED</span>
        </div>
        <p className="text-[10px] text-slate-500">No single person, device or centre is automatically trusted.</p>
      </div>
    </aside>
  );
};
