import { Component, ReactNode } from 'react';

/** Catches render errors so a broken page shows a friendly message instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('[FORYA]', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#F6F5F2', color: '#2E2D2B', fontFamily: 'Bricolage Grotesque, sans-serif' }}>
        <div style={{ maxWidth: 520, textAlign: 'center', display: 'grid', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 36, letterSpacing: '-0.03em' }}>
            Something went wrong. <em style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>Sorry.</em>
          </h1>
          <p style={{ margin: 0, color: '#6E6B65' }}>Reload the page to carry on. Your moments and looks are saved.</p>
          <code style={{ fontSize: 12, color: '#8A4B2E', wordBreak: 'break-word' }}>{this.state.error.message}</code>
          <button onClick={() => location.reload()} style={{ justifySelf: 'center', height: 44, padding: '0 20px', borderRadius: 999, border: 0, background: '#2E2D2B', color: '#F6F5F2', fontWeight: 600, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
