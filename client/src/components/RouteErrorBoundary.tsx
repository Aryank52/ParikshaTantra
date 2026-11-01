import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface RouteErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({ error, resetError }) => (
  <div className="p-6 space-y-4">
    <div className="glass-panel p-6 rounded-2xl border border-red-500/30 shadow-2xl">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-100">Page Error</h3>
          <p className="text-xs text-slate-400 mt-1">
            This page encountered an error and couldn't render properly.
          </p>
          <details className="mt-3 text-left bg-slate-900/50 rounded-lg p-3 border border-slate-800">
            <summary className="text-xs text-slate-400 cursor-pointer font-mono">Technical Details</summary>
            <pre className="mt-2 text-[10px] text-slate-300 font-mono overflow-auto max-h-32">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        </div>
      </div>
      <button
        onClick={resetError}
        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Reload Page</span>
      </button>
    </div>
  </div>
);

interface RouteErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <RouteErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;