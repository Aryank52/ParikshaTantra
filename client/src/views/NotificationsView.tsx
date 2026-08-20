import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Info,
  Trash2,
  Filter
} from 'lucide-react';
import { ViewType } from '../components/Sidebar';

interface NotificationItem {
  id: string;
  title: string;
  category: 'CANDIDATE' | 'SECURITY' | 'SYSTEM' | 'ADMIT_CARD';
  message: string;
  timestamp: string;
  isUnread: boolean;
  actionCode?: string;
  actionLabel?: string;
}

interface NotificationsViewProps {
  portalContext: 'STUDENT' | 'GOVERNMENT';
  onNavigate: (view: ViewType) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ portalContext, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'UPSC CSE Prelims Admit Card Available',
      category: 'ADMIT_CARD',
      message: 'Your official Admit Card for UPSC CSE Prelims 2026 has been generated with digital signature. Terminal Node 14B allocated.',
      timestamp: '19 Aug 2026, 10:30 AM',
      isUnread: true,
      actionCode: 'NAVIGATE_ADMIT_CARD',
      actionLabel: 'View Admit Card',
    },
    {
      id: 'n2',
      title: 'Pre-Exam Device Diagnostic Check Mandatory',
      category: 'CANDIDATE',
      message: 'Please complete the 5-point hardware diagnostic test (camera, microphone, resolution, network latency) before entering CBT Lobby.',
      timestamp: '18 Aug 2026, 04:15 PM',
      isUnread: true,
      actionCode: 'RUN_DEVICE_CHECK',
      actionLabel: 'Run Hardware Test',
    },
    {
      id: 'n3',
      title: 'Centre Gateway Synchronization Status',
      category: 'SYSTEM',
      message: 'Centre DEL-001 Gateway successfully downloaded AES-256 encrypted question package bundle.',
      timestamp: '17 Aug 2026, 09:00 AM',
      isUnread: false,
    },
    {
      id: 'n4',
      title: 'SOC Anomaly Warning: Unregistered IP Attempt',
      category: 'SECURITY',
      message: 'Audit ledger recorded an unauthorized access attempt to vault blueprint route. Blocked by Zero-Trust RBAC guard.',
      timestamp: '16 Aug 2026, 11:45 PM',
      isUnread: false,
      actionCode: 'NAVIGATE_SOC',
      actionLabel: 'View SOC Telemetry',
    },
  ]);

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => (filter === 'UNREAD' ? n.isUnread : true));

  return (
    <div className="p-6 space-y-6 font-sans text-slate-100 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Official Notifications & Bulletins</h1>
            <p className="text-xs text-slate-400">Real-Time Examination Operations & Candidate Alerts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={markAllRead}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            className="text-xs bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`text-xs font-mono px-3 py-1 rounded transition-colors ${
            filter === 'ALL' ? 'bg-blue-900/50 text-blue-200 border border-blue-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ALL ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`text-xs font-mono px-3 py-1 rounded transition-colors ${
            filter === 'UNREAD' ? 'bg-blue-900/50 text-blue-200 border border-blue-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          UNREAD ({notifications.filter((n) => n.isUnread).length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-slate-400">
            <Bell className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No notifications to display in current filter.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start space-x-4 ${
                n.isUnread
                  ? 'bg-slate-900 border-blue-500/40 shadow-md'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}
            >
              <div className="mt-0.5">
                {n.category === 'ADMIT_CARD' && <FileText className="w-5 h-5 text-emerald-400" />}
                {n.category === 'CANDIDATE' && <Info className="w-5 h-5 text-blue-400" />}
                {n.category === 'SYSTEM' && <CheckCircle className="w-5 h-5 text-amber-400" />}
                {n.category === 'SECURITY' && <ShieldAlert className="w-5 h-5 text-red-400" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-sm font-bold ${n.isUnread ? 'text-slate-100' : 'text-slate-300'}`}>
                      {n.title}
                    </h3>
                    {n.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{n.timestamp}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>

                {n.actionLabel && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (n.actionCode === 'RUN_DEVICE_CHECK') onNavigate('DEVICE_CHECK');
                        else if (n.actionCode === 'NAVIGATE_SOC') onNavigate('SOC_OPERATIONS');
                        else onNavigate('EXAM_CATALOG');
                      }}
                      className="text-xs font-mono bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 px-3 py-1 rounded transition-colors"
                    >
                      {n.actionLabel} →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
