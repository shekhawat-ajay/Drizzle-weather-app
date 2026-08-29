import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-error/20 bg-error/5 rounded-xl border p-8 text-center">
          <h2 className="text-error text-lg font-semibold">Something went wrong</h2>
          <p className="text-base-content/60 mt-2 text-sm">
            {this.state.error?.message || "Unexpected error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-sm btn-outline mt-4"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
