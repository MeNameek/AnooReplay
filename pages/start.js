import Link from 'next/link';
import Head from 'next/head';

export default function Start() {
  return (
    <>
      <Head><title>AnooReplay — Start</title></Head>
      <div className="start-page">
        <div className="start-header">
          <Link href="/" className="start-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>AnooReplay</span>
          </Link>
        </div>

        <div className="start-center">
          <h1 className="start-title">Choose your mode</h1>
          <p className="start-subtitle">Bar-by-bar replay on real futures data. Build your edge.</p>

          <div className="start-cards">
            <Link href="/sessions">
              <div className="start-card">
                <div className="start-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                    <polyline points="7 8 10 11 7 14"/>
                    <line x1="13" y1="14" x2="17" y2="14"/>
                  </svg>
                </div>
                <div className="start-card-label">Replay</div>
                <div className="start-card-desc">Step through historical candles. Paper trade. Build your edge.</div>
                <div className="start-card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </Link>

            <div className="start-card start-card-locked">
              <div className="start-card-badge">Coming Soon</div>
              <div className="start-card-icon" style={{ opacity: 0.3 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2"/>
                </svg>
              </div>
              <div className="start-card-label" style={{ textDecoration: 'line-through', opacity: 0.4 }}>Evaluation</div>
              <div className="start-card-desc" style={{ opacity: 0.3 }}>Prop firm style evaluations with rules and targets.</div>
            </div>
          </div>
        </div>

        <div className="start-footer">
          <Link href="/journal" className="start-footer-link">Journal</Link>
          <span className="start-footer-sep">&middot;</span>
          <span className="start-footer-text">Simulated futures replay</span>
        </div>
      </div>
    </>
  );
}
