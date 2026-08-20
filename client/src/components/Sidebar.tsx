import React from 'react';
import {
  Globe,
  BookOpen,
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
  Radio,
  User,
  Bell,
  LogIn,
  LayoutDashboard,
  Shield,
  FileText
} from 'lucide-react';

export type ViewType =
  | 'LANDING'
  | 'LOGIN'
  | 'CANDIDATE_DASHBOARD'
  | 'CANDIDATE_PROFILE'
  | 'NOTIFICATIONS'
  | 'EXAM_CATALOG'
  | 'CONTROL_TOWER'
  | 'CBT_PORTAL'
  | 'CANDIDATE_ARRIVAL'
  | 'DEVICE_CHECK'
  | 'HARDWARE_CHECK'
  | 'ANSWER_SHEETS'
  | 'AUTHORITY_PORTAL'
  | 'STATE_DISTRICT'
  | 'CENTRE_PORTAL'
  | 'CENTRE_GATEWAY'
  | 'TERMINAL_MANAGEMENT'
  | 'SOC_OPERATIONS'
  | 'LEAK_DETECTION'
  | 'LEAK_FORENSICS'
  | 'INSIDER_THREAT'
  | 'AUDIT_LEDGER'
  | 'ATTACK_SIMULATOR'
  | 'CERTIFICATE_VERIFY'
  | 'SYSTEM_STATUS';

interface SidebarProps {
  portalMode: 'STUDENT' | 'GOVERNMENT';
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  onTogglePortal: (mode: 'STUDENT' | 'GOVERNMENT') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  portalMode,
  currentView,
  onSelectView,
  onTogglePortal,
}) => {
  // Student Portal Navigation Items
  const studentNavItems: { id: ViewType; label: string; icon: any; badge?: string }[] = [
    { id: 'CANDIDATE_DASHBOARD', label: 'Candidate Dashboard', icon: LayoutDashboard, badge: 'NEXT EXAM' },
    { id: 'EXAM_CATALOG', label: 'Browse Examinations', icon: BookOpen, badge: 'CATALOG' },
    { id: 'CANDIDATE_PROFILE', label: 'My Profile & Documents', icon: User },
    { id: 'DEVICE_CHECK', label: 'Hardware System Test', icon: Monitor, badge: 'DIAGNOSTIC' },
    { id: 'CBT_PORTAL', label: 'Candidate CBT Lobby', icon: Monitor, badge: 'JIT CBT' },
    { id: 'CERTIFICATE_VERIFY', label: 'Results & Certificates', icon: QrCode, badge: 'PUBLIC' },
    { id: 'NOTIFICATIONS', label: 'Notifications & Alerts', icon: Bell, badge: 'BULLETIN' },
    { id: 'LANDING', label: 'National Landing Portal', icon: Globe },
    { id: 'LOGIN', label: 'Portal Authentication', icon: LogIn },
  ];

  // Government / Administration Portal Navigation Items
  const govNavItems: { id: ViewType; label: string; icon: any; category: string; badge?: string }[] = [
    { id: 'CONTROL_TOWER', label: 'Exam Day Control Tower', icon: Radio, category: 'OVERVIEW', badge: 'LIVE COMMAND' },
    { id: 'AUTHORITY_PORTAL', label: 'Question Vault & Blueprints', icon: Vault, category: 'AUTHORITY', badge: '4-EYES' },
    { id: 'STATE_DISTRICT', label: 'State & District Governance', icon: Landmark, category: 'AUTHORITY', badge: '28 STATES' },
    { id: 'CENTRE_PORTAL', label: 'Centre Network & Activation', icon: Building2, category: 'AUTHORITY' },
    { id: 'HARDWARE_CHECK', label: 'Centre Lab Hardware Grid', icon: Building2, category: 'OPERATIONS', badge: 'LAB GRID' },
    { id: 'TERMINAL_MANAGEMENT', label: 'Terminal Control Desk', icon: Monitor, category: 'OPERATIONS' },
    { id: 'CANDIDATE_ARRIVAL', label: 'Candidate Verification', icon: UserX, category: 'OPERATIONS' },
    { id: 'ANSWER_SHEETS', label: 'Paper Exam OMR Processing', icon: FileCheck2, category: 'OPERATIONS', badge: 'OMR' },
    { id: 'SOC_OPERATIONS', label: 'Security Operations Centre', icon: Activity, category: 'SECURITY', badge: 'SOC' },
    { id: 'LEAK_FORENSICS', label: 'AI Forensic Leak Workbench', icon: FileSearch, category: 'SECURITY', badge: 'GEMINI AI' },
    { id: 'INSIDER_THREAT', label: 'AI Threat & Anomaly Engine', icon: UserX, category: 'SECURITY', badge: 'AI' },
    { id: 'AUDIT_LEDGER', label: 'Tamper-Evident Audit Ledger', icon: FileCheck2, category: 'FORENSICS', badge: 'MERKLE' },
    { id: 'ATTACK_SIMULATOR', label: 'Attack Simulator (Judge Demo)', icon: Zap, category: 'DEMO', badge: '10 SCENARIOS' },
    { id: 'SYSTEM_STATUS', label: 'System Health & Metrics', icon: Activity, category: 'PUBLIC', badge: 'HEALTH' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 p-3 flex flex-col justify-between h-[calc(100vh-65px)] font-sans overflow-y-auto">
      <div className="space-y-4">
        {/* Portal Switcher Banner in Sidebar */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-2">
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider text-center">
            ACTIVE PORTAL CONTEXT
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono font-bold">
            <button
              onClick={() => onTogglePortal('STUDENT')}
              className={`py-1.5 rounded text-center transition-all ${
                portalMode === 'STUDENT'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              STUDENT
            </button>
            <button
              onClick={() => onTogglePortal('GOVERNMENT')}
              className={`py-1.5 rounded text-center transition-all ${
                portalMode === 'GOVERNMENT'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              GOVT
            </button>
          </div>
        </div>

        {/* Render Navigation Links based on Portal Context */}
        {portalMode === 'STUDENT' ? (
          <div className="space-y-1">
            <h2 className="text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase px-3 mb-1.5">
              CANDIDATE SERVICES
            </h2>
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-900/50 text-blue-200 border border-blue-500/50 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-900 text-blue-300 border border-slate-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {['OVERVIEW', 'AUTHORITY', 'OPERATIONS', 'SECURITY', 'FORENSICS', 'DEMO', 'PUBLIC'].map((cat) => {
              const items = govNavItems.filter((i) => i.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <h2 className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase px-3 mb-1.5">
                    {cat} ECOSYSTEM
                  </h2>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectView(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/50 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex-shrink-0 ${
                              item.id === 'ATTACK_SIMULATOR'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-slate-900 text-emerald-300 border border-slate-800'
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
        )}
      </div>

      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center space-y-1 mt-4">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-400 font-semibold font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ZERO-TRUST MODEL</span>
        </div>
        <p className="text-[10px] text-slate-400">All session signatures and tokens derived on backend.</p>
      </div>
    </aside>
  );
};
