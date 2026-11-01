import React, { useState } from 'react';
import {
  CentreReadinessEvaluation,
  ReadinessChecklistItem,
  ReadinessChecklistCategory,
} from '../types';
import { StatusBadge } from './StatusBadge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Wrench,
  AlertOctagon,
  KeyRound,
  HardDrive,
  Users,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface ReadinessChecklistProps {
  evaluation: CentreReadinessEvaluation;
  onRefresh?: () => void;
  onRequestOverride?: () => void;
  userRole?: string;
  isEvaluating?: boolean;
}

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({
  evaluation,
  onRefresh,
  onRequestOverride,
  userRole = '',
  isEvaluating = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ISSUES_ONLY'>('ALL');

  const categories: { key: string; label: string; icon: any }[] = [
    { key: 'ALL', label: 'All Dimensions', icon: Sparkles },
    { key: 'IDENTITY', label: 'Identity', icon: ShieldCheck },
    { key: 'EXAM_ASSIGNMENT', label: 'Exam Shift', icon: KeyRound },
    { key: 'ACTIVATION', label: 'HMAC Gateway', icon: KeyRound },
    { key: 'DEVICE', label: 'Devices', icon: HardDrive },
    { key: 'HARDWARE', label: 'Hardware', icon: Wrench },
    { key: 'CONNECTIVITY', label: 'Network', icon: Wifi },
    { key: 'SECURITY', label: 'Security', icon: ShieldAlert },
    { key: 'ALLOCATION', label: 'Candidates', icon: Users },
  ];

  const filteredItems = evaluation.checklist.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (filterMode === 'ISSUES_ONLY' && item.status === 'READY') {
      return false;
    }
    return true;
  });

  const canOverride =
    ['SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'EXAM_CONTROLLER'].includes(userRole);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl min-w-[80px]">
              <span className={`text-2xl font-mono font-bold ${getScoreColor(evaluation.scorePercentage)}`}>
                {evaluation.scorePercentage}%
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mt-0.5">
                Readiness
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-zinc-100">{evaluation.name}</h4>
                <span className="text-xs font-mono text-zinc-500">({evaluation.centreCode})</span>
                <StatusBadge status={evaluation.status} size="sm" />
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {evaluation.district}, {evaluation.state} • Evaluated at{' '}
                <span className="font-mono text-zinc-300">
                  {new Date(evaluation.evalTimestamp).toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isEvaluating}
                className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-lg flex items-center gap-1.5 transition"
                title="Re-run real-time 8-dimension audit"
              >
                <RefreshCw size={13} className={isEvaluating ? 'animate-spin' : ''} />
                <span>{isEvaluating ? 'Evaluating...' : 'Re-Evaluate'}</span>
              </button>
            )}

            {evaluation.status === 'BLOCKED' && canOverride && onRequestOverride && (
              <button
                type="button"
                onClick={onRequestOverride}
                className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/50 rounded-lg flex items-center gap-1.5 transition"
                title="Executive authority override for emergency dispatch"
              >
                <AlertOctagon size={13} />
                <span>Executive Override</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Operational Override Warning */}
        {evaluation.activeOverride && (
          <div className="mt-3.5 p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertOctagon size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-200">
                Operational Readiness Override Active ({evaluation.activeOverride.role})
              </div>
              <div className="text-amber-300/90 mt-0.5 font-mono text-[11px]">
                Justification: "{evaluation.activeOverride.reason}"
              </div>
              <div className="text-amber-400/60 text-[10px] mt-0.5">
                Logged to immutable Audit Ledger at {new Date(evaluation.activeOverride.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-zinc-800">
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Terminals Ready</div>
            <div className="text-xs font-mono font-semibold text-zinc-200 mt-1">
              {evaluation.deviceSummary.authorized} / {evaluation.deviceSummary.total}{' '}
              <span className="text-[10px] text-zinc-500">
                ({evaluation.deviceSummary.quarantined} quarantined)
              </span>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-[10px] uppercase font-mono text-zinc-500">HMAC Gateway</div>
            <div className="text-xs font-mono font-semibold text-zinc-200 mt-1">
              {evaluation.activationSummary.isActivated ? (
                <span className="text-emerald-400">ACTIVATED</span>
              ) : (
                <span className="text-rose-400">UNACTIVATED</span>
              )}
            </div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Hardware Checks</div>
            <div className="text-xs font-mono font-semibold text-zinc-200 mt-1">
              Cam: {evaluation.hardwareSummary.cameraPassCount} • Mic: {evaluation.hardwareSummary.micPassCount}
            </div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Candidate Load</div>
            <div className="text-xs font-mono font-semibold text-zinc-200 mt-1">
              {evaluation.candidateAllocation.allocatedCount} / {evaluation.candidateAllocation.capacity}{' '}
              <span className="text-[10px] text-zinc-500">
                ({evaluation.candidateAllocation.utilizationPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Icon size={12} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Issue Filter Toggle */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-2 py-0.5 text-[11px] rounded transition ${
              filterMode === 'ALL'
                ? 'bg-zinc-800 text-zinc-200 font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All Items ({evaluation.checklist.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('ISSUES_ONLY')}
            className={`px-2 py-0.5 text-[11px] rounded transition ${
              filterMode === 'ISSUES_ONLY'
                ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300 font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Issues Only ({evaluation.blockingFailures + evaluation.warnings})
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
            No checklist items match the current filter criteria.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isFailed = item.status === 'FAILED';
            const isWarning = item.status === 'WARNING';
            const isReady = item.status === 'READY';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isFailed
                    ? 'bg-rose-950/20 border-rose-900/40'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-900/40'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isReady && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {isWarning && <AlertTriangle size={16} className="text-amber-400" />}
                      {isFailed && <XCircle size={16} className="text-rose-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-200">{item.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500">[{item.code}]</span>
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                            item.severity === 'BLOCKING'
                              ? 'text-rose-400 border-rose-500/30 bg-rose-950/30'
                              : item.severity === 'DEGRADED'
                              ? 'text-amber-400 border-amber-500/30 bg-amber-950/30'
                              : 'text-blue-400 border-blue-500/30 bg-blue-950/30'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mt-1">{item.details}</p>

                      {/* Remedy Action Box */}
                      {item.remedyAction && (
                        <div className="mt-2 text-xs bg-zinc-950/70 p-2 rounded-lg border border-zinc-800 flex items-start gap-2">
                          <Wrench size={13} className="text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-zinc-300 text-[11px]">
                            <span className="text-amber-400 font-medium">Remedy: </span>
                            {item.remedyAction}
                          </div>
                        </div>
                      )}

                      {/* Override role required notice */}
                      {item.overrideRoleRequired && isFailed && (
                        <div className="mt-1.5 text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <AlertOctagon size={11} className="text-rose-400" />
                          <span>Requires {item.overrideRoleRequired} authorization to override</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <StatusBadge status={item.status} size="sm" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

