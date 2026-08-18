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
} from 'lucide-react';


export type ViewType =
  | 'LANDING'
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
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const navItems: { id: ViewType; label: string; icon: any; category: string; badge?: string }[] = [
    { id: 'LANDING', label: 'National Landing Portal', icon: Globe, category: 'PUBLIC', badge: 'HOME' },
    { id: 'EXAM_CATALOG', label: 'Public Exam Catalog', icon: BookOpen, category: 'PUBLIC', badge: '12 EXAMS' },
    { id: 'SYSTEM_STATUS', label: 'Public System Status', icon: Activity, category: 'PUBLIC', badge: 'HEALTH' },
    { id: 'CONTROL_TOWER', label: 'Exam Day Control Tower', icon: Radio, category: 'OPERATIONS', badge: 'LIVE COMMAND' },
    { id: 'CANDIDATE_ARRIVAL', label: 'Candidate Arrival Desk', icon: UserX, category: 'OPERATIONS', badge: 'ENTRY' },
    { id: 'DEVICE_CHECK', label: 'Candidate Hardware Test', icon: Monitor, category: 'OPERATIONS', badge: 'DIAGNOSTIC' },
    { id: 'CENTRE_GATEWAY', label: 'Virtual Centre Gateway', icon: Building2, category: 'OPERATIONS', badge: 'NODE' },
    { id: 'HARDWARE_CHECK', label: 'Centre Lab Hardware', icon: Building2, category: 'OPERATIONS', badge: 'LAB GRID' },
    { id: 'ANSWER_SHEETS', label: 'Paper Answer Sheets', icon: FileCheck2, category: 'OPERATIONS', badge: 'OMR SCAN' },
    { id: 'TERMINAL_MANAGEMENT', label: 'Terminal & Lab Control', icon: Monitor, category: 'OPERATIONS', badge: 'INVIGILATOR' },
    { id: 'CBT_PORTAL', label: 'Candidate CBT Engine', icon: Monitor, category: 'EXAMINATION', badge: 'JIT' },
    { id: 'AUTHORITY_PORTAL', label: 'Question Vault & Blueprint', icon: Vault, category: 'AUTHORITY' },
    { id: 'STATE_DISTRICT', label: 'State & District Governance', icon: Landmark, category: 'AUTHORITY', badge: '28 STATES' },
    { id: 'CENTRE_PORTAL', label: 'Centre Network & Activation', icon: Building2, category: 'AUTHORITY' },
    { id: 'SOC_OPERATIONS', label: 'Security Command Centre', icon: Activity, category: 'SECURITY', badge: 'SOC' },
    { id: 'LEAK_FORENSICS', label: 'AI Forensic Leak Workbench', icon: FileSearch, category: 'SECURITY', badge: 'GEMINI AI' },
    { id: 'LEAK_DETECTION', label: 'Semantic Leak Matcher', icon: FileSearch, category: 'SECURITY', badge: 'AI' },
    { id: 'INSIDER_THREAT', label: 'AI Threat & Anomaly Engine', icon: UserX, category: 'SECURITY', badge: 'AI' },
    { id: 'AUDIT_LEDGER', label: 'Hash-Chain Audit Verifier', icon: FileCheck2, category: 'FORENSICS' },
    { id: 'CERTIFICATE_VERIFY', label: 'QR Certificate Verification', icon: QrCode, category: 'VERIFICATION', badge: 'PUBLIC' },
    { id: 'ATTACK_SIMULATOR', label: 'Attack Simulator (Judge Demo)', icon: Zap, category: 'DEMO', badge: '10 SCENARIOS' },
  ];


  const categories = ['PUBLIC', 'OPERATIONS', 'EXAMINATION', 'AUTHORITY', 'SECURITY', 'FORENSICS', 'VERIFICATION', 'DEMO'];


  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 p-3 flex flex-col justify-between h-[calc(100vh-65px)] font-sans overflow-y-auto">
      <div className="space-y-5">
        {categories.map((category) => {
          const categoryItems = navItems.filter((i) => i.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <h2 className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase px-3 mb-1.5">
                {category} ECOSYSTEM
              </h2>
              {categoryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-900/40 text-blue-200 border border-blue-500/50 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex-shrink-0 ${
                          item.id === 'ATTACK_SIMULATOR'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
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

      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center space-y-1 mt-4">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-400 font-semibold font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ZERO-TRUST MODEL</span>
        </div>
        <p className="text-[10px] text-slate-400">No single person, device or centre is automatically trusted.</p>
      </div>
    </aside>
  );
};
