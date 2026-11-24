import React from 'react';

interface State { error: Error | null }

/** Prevents one bad render from blanking the whole app — and shows the real cause with friendly recovery. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[dorymo] APP CRASH:', error.message, '\n', error.stack, '\n', info.componentStack);
  }

  resetError = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isDomConflict =
      this.state.error.message.includes('insertBefore') ||
      this.state.error.message.includes('removeChild');

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#09090b] px-4 text-center text-zinc-100">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            {isDomConflict
              ? 'ব্রাউজারের অটো-ট্রান্সলেট বা এক্সটেনশনের কারণে ইন্টারফেসে সাময়িক সমস্যা হয়েছে। নিচের বোতামে চাপ দিয়ে পুনরায় চেষ্টা করুন।'
              : 'Refresh and try again. If it keeps happening, send this exact error to the developer.'}
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-left font-mono text-[11px] text-red-300">
            {this.state.error.message}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={this.resetError}
              className="rounded-xl border border-white/20 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              পুনরায় চেষ্টা করুন (Retry)
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-95"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
