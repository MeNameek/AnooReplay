import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing">
      <div className="land-head">
        <span className="land-wordmark">AnooReplay</span>
        <span className="land-tag">Beta</span>
      </div>

      <div className="land-hero">
        <h1>Practice trading.<br/>Risk nothing.</h1>
        <p>
          Bar-by-bar replay for NQ, ES, MNQ, and MES futures.
          Step through years of real 1-minute data. Paper trade.
          Build your edge.
        </p>
      </div>

      <nav className="land-nav">
        <Link href="/backtest">
          <div className="land-link">
            <span className="land-link-num">01</span>
            <div className="land-link-body">
              <div className="land-link-title">Charts</div>
              <div className="land-link-desc">Bar-by-bar replay with simulated trading on historical futures data.</div>
            </div>
            <span className="land-link-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </div>
        </Link>

        <Link href="/journal">
          <div className="land-link">
            <span className="land-link-num">02</span>
            <div className="land-link-body">
              <div className="land-link-title">Journal</div>
              <div className="land-link-desc">Every closed trade, laid out as a scrollable ledger.</div>
            </div>
            <span className="land-link-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </div>
        </Link>

        <div className="land-link" style={{ opacity: 0.35, cursor: 'default' }}>
          <span className="land-link-num">03</span>
          <div className="land-link-body">
            <div className="land-link-title">Daily Challenge</div>
            <div className="land-link-desc">One hidden day. One try. Climb the board.</div>
          </div>
          <span className="land-tag">Soon</span>
        </div>
      </nav>

      <div className="land-footer">
        <span>Simulated futures replay</span>
        <span>·</span>
        <span>Not investment advice</span>
      </div>
    </div>
  );
}
