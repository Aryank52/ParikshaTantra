import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'metric' | 'avatar';
  lines?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  lines = 3,
  className = '',
}) => {
  const baseClasses = 'animate-pulse bg-slate-800 rounded';
  
  const variants = {
    text: 'h-4 w-full',
    card: 'h-64 w-full',
    table: 'h-12 w-full',
    metric: 'h-16 w-full',
    avatar: 'h-10 w-10 rounded-full',
  };

  if (variant === 'text') {
    return (
      <div className={`${className} space-y-3`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`${baseClasses} ${variants.text} ${i === lines - 1 ? 'w-3/4' : ''}`} />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${className} ${baseClasses} ${variants.card} space-y-4 p-6`}>
        <div className="h-6 w-1/4" />
        <div className="h-4 w-1/2" />
        <div className="h-4 w-3/4" />
        <div className="h-4 w-full" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`${className} space-y-3`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className={`${baseClasses} ${variants.table} flex-1`} />
            <div className={`${baseClasses} ${variants.table} flex-1`} />
            <div className={`${baseClasses} ${variants.table} flex-1`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'metric') {
    return (
      <div className={`${className} ${baseClasses} ${variants.metric}`} />
    );
  }

  if (variant === 'avatar') {
    return <div className={`${className} ${baseClasses} ${variants.avatar}`} />;
  }

  return null;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${className} glass-panel p-6 rounded-2xl border border-slate-800 animate-pulse`}>
    <Skeleton variant="metric" className="mb-4" />
    <Skeleton variant="text" lines={2} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <div className={`${className} glass-panel p-6 rounded-2xl border border-slate-800`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="text" lines={1} className="w-1/3" />
    </div>
    <Skeleton variant="table" lines={rows} />
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`${className} space-y-4`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-4 animate-pulse">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" lines={1} className="w-1/3" />
          <Skeleton variant="text" lines={1} className="w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;