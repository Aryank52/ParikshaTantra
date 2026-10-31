import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return React.createElement(this.props.fallback, {
          error: this.state.error!,
          resetError: this.resetError,
        });
      }

      return (
        <div className="min-h-screen bg-[#080E18] flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-2xl border border-red-500/30 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-2">
                An unexpected error occurred. The error has been logged.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <summary className="text-xs text-slate-400 cursor-pointer font-mono">Error Details</summary>
                  <pre className="mt-2 text-[10px] text-slate-300 font-mono overflow-auto max-h-40">
                    {this.state.error.message}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex items-center justify-center space-x-4 pt-2">
              <button
                onClick={this.resetError}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;