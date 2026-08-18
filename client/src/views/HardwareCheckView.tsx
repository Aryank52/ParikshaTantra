import React, { useState } from 'react';
import { Building2, Monitor, CheckCircle2, AlertTriangle, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../services/api';

export const HardwareCheckView: React.FC = () => {
  const [labNodes, setLabNodes] = useState([
    { id: 'T01', name: 'Node 14A', ip: '192.168.10.14', status: 'READY', camera: 'PASS', mic: 'PASS', latency: '2ms' },
    { id: 'T02', name: 'Node 14B', ip: '192.168.10.15', status: 'READY', camera: 'PASS', mic: 'PASS', latency: '3ms' },
    { id: 'T03', name: 'Node 14C', ip: '192.168.10.16', status: 'READY', camera: 'PASS', mic: 'PASS', latency: '4ms' },
    { id: 'T04', name: 'Node 14D', ip: '192.168.10.17', status: 'READY', camera: 'PASS', mic: 'PASS', latency: '2ms' },
    { id: 'T05', name: 'Node 15A', ip: '192.168.10.18', status: 'WARNING', camera: 'PASS', mic: 'CHECK', latency: '45ms' },
    { id: 'T06', name: 'Node 15B', ip: '192.168.10.19', status: 'READY', camera: 'PASS', mic: 'PASS', latency: '3ms' },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshGrid = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="gov-panel p-6 border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-950 border border-blue-500/30 rounded-xl text-blue-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-slate-100">
              Exam Centre Lab Node Hardware & Terminal Diagnostic Control
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Centre: <strong className="text-slate-200">TCS iON Digital Zone Powai, Dwarka, Delhi (CENTRE-DELHI-01)</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshGrid}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-blue-300 text-xs font-mono font-bold rounded-xl border border-slate-800 flex items-center space-x-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>PING ALL TERMINALS</span>
        </button>
      </div>

      {/* Lab Terminal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {labNodes.map((node) => (
          <div key={node.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono font-bold text-slate-200 text-xs">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>{node.name} ({node.id})</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                node.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}>
                {node.status}
              </span>
            </div>

            <div className="text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>IP Address:</span>
                <span className="text-slate-200">{node.ip}</span>
              </div>
              <div className="flex justify-between">
                <span>Camera Sensor:</span>
                <span className="text-emerald-400 font-bold">{node.camera}</span>
              </div>
              <div className="flex justify-between">
                <span>LAN Latency:</span>
                <span className="text-slate-200">{node.latency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
