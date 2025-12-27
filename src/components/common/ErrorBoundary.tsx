import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, send to error tracking service (Sentry, etc.)
    if (import.meta.env.PROD) {
      // window.reportError?.(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Ops! Qualcosa è andato storto
                </h1>
                <p className="text-slate-600">
                  Si è verificato un errore imprevisto nell'applicazione. Il nostro team è stato notificato.
                </p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <h3 className="text-sm font-bold text-red-900 mb-2">Dettagli Errore (solo in sviluppo)</h3>
                <pre className="text-xs text-red-800 overflow-auto max-h-64 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors"
              >
                <RefreshCw size={18} />
                Riprova
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
              >
                <Home size={18} />
                Torna alla Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
