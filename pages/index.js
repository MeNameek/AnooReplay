import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">AnooReplay</span>
        <span className="landing-version">· BETA 0.1.0</span>
      </header>

      <div className="landing-hero">
        <h1>AnooReplay</h1>
        <p>
          Bar-by-bar market replay and paper trading for futures — practice on years of real
          historical data. No real money.
        </p>
      </div>

      <nav className="landing-nav">
        <Link href="/backtest" style={{ textDecoration: 'none', color: 'inherit' }}>
          <button className="landing-nav-item">
            <span className="landing-nav-num">01</span>
            <span className="landing-nav-title">CHARTS</span>
            <span className="landing-nav-desc">
              Bar-by-bar replay of historical futures data, with simulated trading.
            </span>
          </button>
        </Link>

        <Link href="/journal" style={{ textDecoration: 'none', color: 'inherit' }}>
          <button className="landing-nav-item">
            <span className="landing-nav-num">02</span>
            <span className="landing-nav-title">JOURNAL</span>
            <span className="landing-nav-desc">
              Every closed trade, laid out as a quiet, scrollable ledger.
            </span>
          </button>
        </Link>

        <button className="landing-nav-item" disabled style={{ opacity: 0.4 }}>
          <span className="landing-nav-num">03</span>
          <span className="landing-nav-title">DAILY CHALLENGE</span>
          <span className="landing-nav-desc">
            One hidden day. One try. Trade the open, earn EP, climb the board.
          </span>
          <span className="landing-nav-badge">SOON</span>
        </button>

        <button className="landing-nav-item" disabled style={{ opacity: 0.4 }}>
          <span className="landing-nav-num">04</span>
          <span className="landing-nav-title">LEADERBOARD</span>
          <span className="landing-nav-desc">
            See who&apos;s dominating the charts this week.
          </span>
          <span className="landing-nav-badge">SOON</span>
        </button>
      </nav>

      <div className="landing-footer">
        <a href="/backtest">START TRADING</a>
        <span>·</span>
        <span>SIMULATED FUTURES REPLAY — NOT INVESTMENT ADVICE</span>
      </div>
    </div>
  );
}
