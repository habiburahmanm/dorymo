import React from 'react';

interface State { error: Error | null }

/** Prevents one bad render from blanking the whole app — and shows the real cause. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[dorymo] APP CRASH:', error.message, '\n', error.stack, '\n', info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#09090b] px-4 text-center text-zinc-100">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-zinc-900/50 p-8">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Refresh and try again. If it keeps happening, send this exact error to the developer.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-left font-mono text-[11px] text-red-300">
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
