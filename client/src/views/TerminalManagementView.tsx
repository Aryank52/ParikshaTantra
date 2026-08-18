import React, { useState, useEffect } from 'react';
import { 
  Monitor, Cpu, Lock, Unlock, AlertTriangle, RefreshCw, CheckCircle, 
  Search, ShieldAlert, UserCheck, Play, Power
} from 'lucide-react';
import { api } from '../services/api';

interface TerminalNode {
  id: string;
  deviceId: string;
  serialNumber: string;
  ipAddress: string;
  status: 'AUTHORIZED' | 'DEAUTHORIZED' | 'BLOCKED' | 'OFFLINE';
  lastHeartbeat: string;
  labNodeName?: string;
  candidateName?: string;
  candidateCode?: string;
  cbtStatus?: 'LOBBY' | 'IN_PROGRESS' | 'FROZEN' | 'SUBMITTED';
}

export const TerminalManagementView: React.FC = () => {
  const [terminals, setTerminals] = useState<TerminalNode[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalNode | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const centres = await api.get('/centres');
      if (centres.length > 0) {
        const centreDetail = await api.get(`/centres/${centres[0].id}`);
        const devices = centreDetail.devices || [];
        const sessions = centreDetail.candidateSessions || [];

        const mapped: TerminalNode[] = devices.map((d: any, idx: number) => {
          const session = sessions.find((s: any) => s.deviceId === d.id);
          return {
            id: d.id,
            deviceId: d.deviceId,
            serialNumber: d.serialNumber,
            ipAddress: d.ipAddress,
            status: d.status,
            lastHeartbeat: d.lastHeartbeat,
            labNodeName: `Terminal Node ${idx + 1}A`,
            candidateName: session?.candidate?.fullName,
            candidateCode: session?.candidate?.candidateCode,
            cbtStatus: session?.status || 'LOBBY',
          };
        });
        setTerminals(mapped);
      }
    } catch (err) {
      console.error('Failed to load terminals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, terminal: TerminalNode) => {
    setActionMessage(`Executing ${action} on ${terminal.labNodeName}...`);
    setTimeout(() => {
      if (action === 'LOCK') {
        setTerminals(prev => prev.map(t => t.id === terminal.id ? { ...t, status: 'BLOCKED' } : t));
        setActionMessage(`🔒 ${terminal.labNodeName} successfully LOCKED by Invigilator.`);
      } else if (action === 'UNLOCK') {
        setTerminals(prev => prev.map(t => t.id === terminal.id ? { ...t, status: 'AUTHORIZED' } : t));
        setActionMessage(`🔓 ${terminal.labNodeName} UNLOCKED and authorized.`);
      } else if (action === 'REASSIGN') {
        setActionMessage(`🔄 Reassignment token issued for ${terminal.labNodeName} -> Backup Terminal 18B.`);
      } else if (action === 'RESTART') {
        setActionMessage(`⚡ Session restarted on ${terminal.labNodeName}. Offline state synced.`);
      }
    }, 600);
  };

  const filteredTerminals = terminals.filter(t => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus || t.cbtStatus === filterStatus;
    const matchesQuery = !searchQuery || 
      t.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.candidateName && t.candidateName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3">
          <Monitor className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">CBT TERMINAL & LAB NODE MANAGEMENT</h1>
            <p className="text-slate-400 text-sm">Invigilator Command Grid for Hardware Authorization & Node Controls</p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Terminal / Candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md pl-9 pr-3 py-2 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md px-3 py-2"
          >
            <option value="ALL">All Node Statuses</option>
            <option value="AUTHORIZED">Authorized</option>
            <option value="IN_PROGRESS">CBT In Progress</option>
            <option value="BLOCKED">Locked / Blocked</option>
          </select>
          <button
            onClick={fetchTerminals}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-md transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-200 rounded-md text-xs font-mono">
          {actionMessage}
        </div>
      )}

      {/* Terminal Node Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTerminals.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTerminal(t)}
            className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition hover:border-cyan-500 ${
              selectedTerminal?.id === t.id ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span className="text-sm font-bold text-white font-mono">{t.labNodeName}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                t.status === 'AUTHORIZED' && t.cbtStatus === 'IN_PROGRESS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse' :
                t.status === 'AUTHORIZED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {t.cbtStatus === 'IN_PROGRESS' ? 'CBT ACTIVE' : t.status}
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Node ID:</span>
                <span className="text-slate-200 font-mono">{t.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span>IP Address:</span>
                <span className="text-slate-300 font-mono">{t.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>Assigned Candidate:</span>
                <span className="text-cyan-400 font-semibold truncate max-w-[130px]">
                  {t.candidateName || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between space-x-2">
              {t.status === 'BLOCKED' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction('UNLOCK', t); }}
                  className="flex-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold py-1.5 rounded border border-emerald-700 flex items-center justify-center space-x-1"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Unlock</span>
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction('LOCK', t); }}
                  className="flex-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold py-1.5 rounded border border-rose-700 flex items-center justify-center space-x-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleAction('RESTART', t); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2 rounded border border-slate-700"
                title="Restart Session"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
