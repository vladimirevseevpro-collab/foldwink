import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Foldwink crashed:", error, info);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-full w-full flex justify-center">
          <main className="w-full max-w-md px-4 py-10 text-center">
            <div className="text-[10px] uppercase text-muted mb-2">
              Something broke
            </div>
            <h1 className="text-2xl font-bold mb-3">Foldwink stumbled</h1>
            <p className="text-sm text-muted mb-6">
              An unexpected error stopped the game. Reloading usually fixes it. Your stats are
              saved.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-accent text-ink px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Reload Foldwink
            </button>
            {import.meta.env.DEV && (
              <pre className="mt-6 text-left text-[10px] text-muted whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            )}
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}
