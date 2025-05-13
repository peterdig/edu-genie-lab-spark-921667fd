import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border border-border">
            <h2 className="text-xl font-bold text-destructive mb-4">Something went wrong</h2>
            <div className="bg-muted p-4 rounded mb-4 overflow-auto max-h-[300px] text-sm">
              <p className="font-mono text-destructive mb-2">{this.state.error && this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
              <Button variant="outline" onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}>
                Clear Storage & Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 