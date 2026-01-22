import React from "react";
import { Button } from "@/components/ui/button";
import { logClientError } from "@/lib/errorLogging";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Erro não tratado (ErrorBoundary):", error, errorInfo);
    logClientError(error, { componentStack: errorInfo.componentStack });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoLogin = () => {
    window.location.assign("/login");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-lg border bg-card p-6">
          <h1 className="text-xl font-semibold">Algo deu errado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O app encontrou um erro inesperado. Você pode recarregar a página ou voltar ao login.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button onClick={this.handleReload}>
              Recarregar
            </Button>
            <Button variant="outline" onClick={this.handleGoLogin}>
              Ir para Login
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-4 max-h-48 overflow-auto rounded bg-muted p-3 text-xs text-foreground">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
