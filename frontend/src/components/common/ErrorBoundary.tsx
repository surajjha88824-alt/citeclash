import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CiteClash ErrorBoundary caught error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#FAFAFB] text-[#111113]">
          <div className="max-w-md w-full linear-card rounded-2xl p-8 border border-red-500/30 text-center shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-semibold text-[#111113] mb-2">Something went wrong</h3>
            <p className="text-xs text-[#52525B] mb-6 leading-relaxed">
              An unexpected client error occurred while rendering this module. Your data is safe on the server.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] text-left overflow-x-auto">
                <span className="text-[11px] font-mono text-[#E11D48] block break-words">
                  {this.state.error.message}
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#111113] text-white hover:bg-[#27272A] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
