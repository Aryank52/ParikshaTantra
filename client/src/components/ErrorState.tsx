import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  onHome?: () => void;
  onReport?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onHome,
  onReport,
  title,
  message,
  showDetails = true,
  className = '',
  compact = false,
}) => {
  if (!error) return null;

  const compactTextClass = compact ? 'text-sm' : 'text-lg';
  const compactSmallClass = compact ? 'text-[10px]' : 'text-xs';
  const compactMarginClass = compact ? 'mt-3' : 'mt-6';

  return (
    <div
      className={`glass-panel p-6 rounded-2xl border border-red-500/30 shadow-2xl ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-slate-100 ${compactTextClass}`}>
            {title || 'Something went wrong'}
          </h3>
          <p className={`text-slate-400 mt-2 ${compactSmallClass}`}>
            {message || error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {showDetails && error.stack && (
            <details className="mt-3 text-left bg-slate-900/50 rounded-lg p-3 border border-slate-800 overflow-hidden">
              <summary className="text-xs text-slate-400 cursor-pointer font-mono select-none">
                Technical Details
              </summary>
              <pre className="mt-2 text-[10px] text-slate-300 font-mono overflow-auto max-h-40 whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
      <div className={`flex items-center justify-center space-x-3 ${compactMarginClass}`}>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 shadow-lg shadow-blue-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        {onHome && (
          <button
            onClick={onHome}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
        )}
        {onReport && (
          <button
            onClick={onReport}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 border border-slate-700"
          >
            <Bug className="w-4 h-4" />
            <span>Report Issue</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;