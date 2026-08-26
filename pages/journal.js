import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Journal() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('anoreplay:trades');
    if (saved) try { setTrades(JSON.parse(saved)); } catch {}
  }, []);

  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : '0.0';
  const avgPnl = trades.length > 0 ? (totalPnl / trades.length).toFixed(2) : '0.00';

  return (
    <>
      <Head><title>AnooReplay — Journal</title></Head>
      <div style={{ display: 'flex', height: '100vh' }}>
        <div className="app-sidebar">
          <Link href="/" className="sidebar-logo" title="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <div className="sidebar-divider" />
          <Link href="/backtest" className="sidebar-icon" title="Charts">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </Link>
          <Link href="/journal" className="sidebar-icon active" title="Journal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </Link>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="journal-page">
            <div className="journal-header">
              <div>
                <Link href="/backtest" className="back-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </Link>
                <h1>Journal</h1>
              </div>
            </div>

            <div className="journal-stats">
              <div className="journal-stat-card">
                <div className="label">Total P&amp;L</div>
                <div className="value" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                </div>
              </div>
              <div className="journal-stat-card">
                <div className="label">Win Rate</div>
                <div className="value">{winRate}%</div>
              </div>
              <div className="journal-stat-card">
                <div className="label">Trades</div>
                <div className="value">{trades.length}</div>
              </div>
              <div className="journal-stat-card">
                <div className="label">Avg P&amp;L</div>
                <div className="value" style={{ color: parseFloat(avgPnl) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {parseFloat(avgPnl) >= 0 ? '+' : ''}{avgPnl}
                </div>
              </div>
            </div>

            {trades.length === 0 ? (
              <div className="empty-state" style={{ height: '300px' }}>
                <span>No trades yet. Start backtesting.</span>
              </div>
            ) : (
              <table className="trades-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Qty</th>
                    <th>P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{t.symbol}</td>
                      <td style={{ color: t.side === 'long' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                        {t.side.toUpperCase()}
                      </td>
                      <td>{t.entryPrice?.toFixed(2)}</td>
                      <td>{t.exitPrice?.toFixed(2)}</td>
                      <td>{t.qty}</td>
                      <td style={{ color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
