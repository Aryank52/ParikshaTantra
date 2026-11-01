import React from 'react';
import { Loader2, Zap, Database, Globe, Shield } from 'lucide-react';

interface LoadingStateProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'page' | 'inline';
  message?: string;
  subMessage?: string;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  message,
  subMessage,
  icon,
  className = '',
  size = 'md',
  overlay = false,
}) => {
  const baseClasses = 'flex flex-col items-center justify-center';

  const spinner = (
    <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
  );

  const dots = (
    <div className="flex items-center space-x-1.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full bg-blue-500 animate-bounce`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );

  const pulse = (
    <div className={`w-12 h-12 rounded-full bg-blue-500/30 animate-ping`} />
  );

  const skeleton = (
    <div className="w-48 h-8 bg-slate-800 rounded-lg animate-pulse" />
  );

  const content = (
    <div className={`${baseClasses} ${className}`}>
      {icon || (
        <div className="mb-4" aria-hidden="true">
          {variant === 'spinner' && spinner}
          {variant === 'dots' && dots}
          {variant === 'pulse' && pulse}
          {variant === 'skeleton' && skeleton}
        </div>
      )}
      {message && <p className="text-sm text-slate-300 font-medium">{message}</p>}
      {subMessage && <p className="text-xs text-slate-500 mt-1">{subMessage}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center ${className}`}
        role="status"
        aria-live="polite"
        aria-label={message || 'Loading'}
      >
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 max-w-md w-full mx-4 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={baseClasses} role="status" aria-live="polite" aria-label={message || 'Loading'}>
      {content}
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string; subMessage?: string }> = ({
  message = 'Initializing...',
  subMessage,
}) => (
  <div className="min-h-screen bg-[#080E18] flex items-center justify-center p-6">
    <LoadingState
      variant="spinner"
      size="lg"
      message={message}
      subMessage={subMessage}
      icon={
        <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 mb-6">
          <Shield className="w-10 h-10" />
        </div>
      }
    />
  </div>
);

export const InlineLoader: React.FC<{ message?: string; size?: 'sm' | 'md' }> = ({
  message,
  size = 'sm',
}) => (
  <LoadingState
    variant="spinner"
    size={size}
    message={message}
    className="inline-flex"
  />
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-panel p-6 rounded-2xl border border-slate-800 animate-pulse ${className}`}>
    <div className="h-6 w-1/4 bg-slate-800 rounded mb-4" />
    <div className="h-4 w-1/2 bg-slate-800 rounded mb-2" />
    <div className="h-4 w-3/4 bg-slate-800 rounded" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => (
  <div className={`glass-panel p-6 rounded-2xl border border-slate-800 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 w-1/4 bg-slate-800 rounded animate-pulse" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="flex-1 h-10 bg-slate-800 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`${className} space-y-4`}>
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4 animate-pulse"
      >
        <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-slate-800 rounded animate-pulse" />
          <div className="h-3 w-1/4 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingState;