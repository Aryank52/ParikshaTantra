import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Ban,
  Radio,
  PowerOff,
  Info,
} from 'lucide-react';

export type StatusType =
  | 'READY'
  | 'WARNING'
  | 'DEGRADED'
  | 'BLOCKED'
  | 'FAILED'
  | 'OFFLINE'
  | 'AUTHORIZED'
  | 'PENDING_AUTHORIZATION'
  | 'REGISTERED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'QUARANTINED'
  | 'BLOCKING'
  | 'INFORMATIONAL'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normalized = (status || '').toUpperCase().trim();
  const displayLabel = label || normalized.replace(/_/g, ' ');

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'READY':
      case 'AUTHORIZED':
      case 'PASS':
      case 'ONLINE':
      case 'GREEN':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
        };
      case 'DEGRADED':
      case 'WARNING':
      case 'PENDING_AUTHORIZATION':
      case 'PENDING':
      case 'AMBER':
        return {
          bg: 'bg-amber-950/40 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          icon: AlertTriangle,
        };
      case 'BLOCKED':
      case 'FAILED':
      case 'REVOKED':
      case 'RED':
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/40 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          icon: XCircle,
        };
      case 'QUARANTINED':
        return {
          bg: 'bg-red-950/60 border-red-500/50 text-red-300 animate-pulse',
          dot: 'bg-red-500',
          icon: ShieldAlert,
        };
      case 'SUSPENDED':
        return {
          bg: 'bg-orange-950/40 border-orange-500/30 text-orange-400',
          dot: 'bg-orange-400',
          icon: Ban,
        };
      case 'REGISTERED':
      case 'INFORMATIONAL':
      case 'INFO':
        return {
          bg: 'bg-blue-950/40 border-blue-500/30 text-blue-400',
          dot: 'bg-blue-400',
          icon: Info,
        };
      case 'OFFLINE':
        return {
          bg: 'bg-zinc-800/60 border-zinc-700 text-zinc-400',
          dot: 'bg-zinc-500',
          icon: PowerOff,
        };
      default:
        return {
          bg: 'bg-zinc-850 border-zinc-700 text-zinc-300',
          dot: 'bg-zinc-400',
          icon: Radio,
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 10,
    md: 13,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border backdrop-blur-sm transition-colors ${config.bg} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      {showIcon && <IconComponent size={iconSizes} className="shrink-0" />}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

