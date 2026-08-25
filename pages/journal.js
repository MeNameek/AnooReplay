import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Journal() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('anoreplay:trades');
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        setTrades([]);
      }
    }
  }, []);

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : '0.0';
  const avgPnl = trades.length > 0 ? (totalPnl / trades.length).toFixed(2) : '0.00';

  return (
    <>
      <Head>
        <title>AnooReplay — Journal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', height: '100vh' }}>
        <div className="app-sidebar">
          <Link href="/" className="sidebar-icon" title="Home">🏠</Link>
          <Link href="/backtest" className="sidebar-icon" title="Charts">📊</Link>
          <Link href="/journal" className="sidebar-icon active" title="Journal">📒</Link>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="journal-page">
            <div className="journal-header">
              <div>
                <Link href="/backtest" className="back-btn">← Back to Charts</Link>
                <h1>Trade Journal</h1>
              </div>
            </div>

            <div className="journal-stats">
              <div className="journal-stat-card">
                <div className="label">TOTAL P&L</div>
                <div className="value" style={{ color: totalPnl >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                  {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                </div>
              </div>
              <div className="journal-stat-card">
                <div className="label">WIN RATE</div>
                <div className="value">{winRate}%</div>
              </div>
              <div className="journal-stat-card">
                <div className="label">TOTAL TRADES</div>
                <div className="value">{trades.length}</div>
              </div>
              <div className="journal-stat-card">
                <div className="label">AVG P&L</div>
                <div className="value" style={{ color: parseFloat(avgPnl) >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                  {parseFloat(avgPnl) >= 0 ? '+' : ''}{avgPnl}
                </div>
              </div>
            </div>

            {trades.length === 0 ? (
              <div className="empty-state" style={{ height: '400px' }}>
                <div className="empty-state-icon">📒</div>
                <div>No trades yet</div>
                <div style={{ fontSize: '11px' }}>Go to Charts and start backtesting</div>
              </div>
            ) : (
              <table className="trades-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SYMBOL</th>
                    <th>SIDE</th>
                    <th>ENTRY</th>
                    <th>EXIT</th>
                    <th>QTY</th>
                    <th>P&L</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>
                        <span style={{
                          color: trade.side === 'long' ? 'rgb(34,197,94)' : 'rgb(239,68,68)',
                          fontWeight: 600,
                        }}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td>{trade.entryPrice?.toFixed(2)}</td>
                      <td>{trade.exitPrice?.toFixed(2)}</td>
                      <td>{trade.qty}</td>
                      <td style={{
                        color: trade.pnl >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)',
                        fontWeight: 600,
                      }}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}
                      </td>
                      <td>
                        {trade.time ? new Date(trade.time * 1000).toLocaleDateString() : '--'}
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
