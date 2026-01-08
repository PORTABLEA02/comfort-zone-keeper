import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

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
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({ errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 p-6 border-b border-border">
                <div className="flex items-center space-x-4">
                  <div className="bg-destructive/10 p-3 rounded-xl">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-card-foreground">
                      Oups ! Une erreur est survenue
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'application a rencontré un problème inattendu
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-muted-foreground">
                  Nous nous excusons pour ce désagrément. Vous pouvez essayer de :
                </p>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>Réessayer l'action qui a causé l'erreur</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>Actualiser la page</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>Revenir à la page d'accueil</span>
                  </li>
                </ul>

                {/* Error details in development */}
                {isDevelopment && error && (
                  <div className="mt-4 p-4 bg-muted rounded-xl border border-border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bug className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Détails de l'erreur (Dev)
                      </span>
                    </div>
                    <p className="text-sm font-mono text-destructive break-all">
                      {error.message}
                    </p>
                    {error.stack && (
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32 font-mono">
                        {error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-border text-foreground rounded-xl font-medium hover:bg-muted/50 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Accueil
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Si le problème persiste, veuillez contacter le support technique.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook to programmatically trigger error boundary
export function useErrorHandler() {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// Simple error fallback component for smaller sections
interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  title = "Erreur de chargement",
  message = "Impossible de charger ce contenu"
}: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-xl text-center">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {error && import.meta.env.DEV && (
        <p className="text-xs text-destructive mb-4 font-mono break-all">
          {error.message}
        </p>
      )}
      {resetError && (
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </button>
      )}
    </div>
  );
}
