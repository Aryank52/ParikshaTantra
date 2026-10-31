import React from 'react';
import { FileText, Users, Shield, Search, Inbox, AlertCircle, Plus, ExternalLink, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'no-permission' | 'loading' | 'error' | 'offline';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'link';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'link';
  };
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

const variantConfigs = {
  'no-data': {
    defaultTitle: 'No Data Available',
    defaultMessage: 'There are no records to display at this time.',
    defaultIcon: Inbox,
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-900/50',
  },
  'no-results': {
    defaultTitle: 'No Results Found',
    defaultMessage: 'Try adjusting your search or filter criteria.',
    defaultIcon: Search,
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-900/50',
  },
  'no-permission': {
    defaultTitle: 'Access Restricted',
    defaultMessage: 'You do not have permission to view this content.',
    defaultIcon: Shield,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-900/30',
  },
  'loading': {
    defaultTitle: 'Loading...',
    defaultMessage: 'Please wait while we fetch the data.',
    defaultIcon: Loader2,
    iconColor: 'text-blue-500',
    bgColor: 'bg-slate-900/50',
  },
  'error': {
    defaultTitle: 'Something Went Wrong',
    defaultMessage: 'An error occurred while loading this content.',
    defaultIcon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-900/30',
  },
  'offline': {
    defaultTitle: 'Offline Mode',
    defaultMessage: 'You are currently offline. Some features may be limited.',
    defaultIcon: AlertCircle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-900/30',
  },
};

const actionVariants = {
  primary: 'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2',
  secondary: 'px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors border border-slate-700 flex items-center justify-center space-x-2',
  link: 'text-blue-400 hover:text-blue-300 text-xs font-bold underline-offset-2 hover:underline flex items-center justify-center space-x-2',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  title,
  message,
  action,
  secondaryAction,
  icon,
  className = '',
  compact = false,
}) => {
  const config = variantConfigs[variant];
  const IconComponent = icon ? null : config.defaultIcon;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 ${compact ? 'p-3' : 'p-8'} ${config.bgColor} rounded-2xl border border-slate-800 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`w-16 h-16 ${compact && 'w-10 h-10'} mx-auto rounded-xl flex items-center justify-center mb-4 ${config.iconColor} ${config.bgColor.replace('bg-', 'bg-').replace('500', '100').replace('900', '900')} border border-slate-800`}>
        {icon || (IconComponent && <IconComponent className="w-8 h-8" />)}
      </div>
      <h3 className={`text-lg font-bold text-slate-100 ${compact && 'text-sm'}`}>
        {title || config.defaultTitle}
      </h3>
      <p className={`text-xs text-slate-400 mt-2 max-w-sm mx-auto ${compact && 'text-[10px]'}`}>
        {message || config.defaultMessage}
      </p>
      {(action || secondaryAction) && (
        <div className={`flex items-center justify-center space-x-3 mt-6 ${compact && 'mt-3'}`}>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={actionVariants[secondaryAction.variant || 'secondary']}
            >
              {secondaryAction.label}
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={actionVariants[action.variant || 'primary']}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;