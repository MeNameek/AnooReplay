import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ReplayControls from '../components/ReplayControls';
import TradingPanel from '../components/TradingPanel';
import { CONTRACTS } from '../lib/contracts';

const Chart = dynamic(() => import('../components/Chart'), { ssr: false });

export default function Backtest() {
  const [symbol, setSymbol] = useState('NQ');
  const [timeframe, setTimeframe] = useState(60);
  const [bars, setBars] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [crosshair, setCrosshair] = useState(null);

  // Trading
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [account, setAccount] = useState({
    balance: 100000,
    equity: 100000,
    totalPnl: 0,
  });

  const intervalRef = useRef(null);

  const aggregateBars = useCallback((rawBars, tfSeconds) => {
    if (tfSeconds === 60) return rawBars;
    const aggregated = [];
    let currentBucket = null;
    for (const bar of rawBars) {
      const bucketTime = Math.floor(bar.time / tfSeconds) * tfSeconds;
      if (!currentBucket || currentBucket.time !== bucketTime) {
        if (currentBucket) aggregated.push(currentBucket);
        currentBucket = {
          time: bucketTime,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        };
      } else {
        currentBucket.high = Math.max(currentBucket.high, bar.high);
        currentBucket.low = Math.min(currentBucket.low, bar.low);
        currentBucket.close = bar.close;
        currentBucket.volume += bar.volume;
      }
    }
    if (currentBucket) aggregated.push(currentBucket);
    return aggregated;
  }, []);

  // Fetch available dates
  useEffect(() => {
    setLoading(true);
    fetch(`/data/${symbol}/dates.json`)
      .then(r => r.json())
      .then(dates => {
        setAvailableDates(dates);
        if (dates.length > 0) {
          const mid = dates[Math.floor(dates.length * 0.6)];
          setSelectedDate(mid);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [symbol]);

  // Fetch bars for selected date
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setIsPlaying(false);
    setCurrentIndex(0);

    fetch(`/data/${symbol}/${selectedDate}.json`)
      .then(r => {
        if (!r.ok) throw new Error('No data');
        return r.json();
      })
      .then(data => {
        // Compact format: [[time, open, high, low, close, volume], ...]
        const parsed = Array.isArray(data[0])
          ? data.map(([time, open, high, low, close, volume]) => ({ time, open, high, low, close, volume }))
          : data;
        const aggregated = aggregateBars(parsed, timeframe);
        setBars(aggregated);
        setLoading(false);
      })
      .catch(() => {
        setBars([]);
        setLoading(false);
      });
  }, [selectedDate, symbol, timeframe, aggregateBars]);

  // Replay timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= bars.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, bars.length]);

  const handlePlayPause = () => {
    if (currentIndex >= bars.length - 1) setCurrentIndex(0);
    setIsPlaying(!isPlaying);
  };
  const handleStepForward = () => { setIsPlaying(false); setCurrentIndex(p => Math.min(p + 1, bars.length - 1)); };
  const handleStepBack = () => { setIsPlaying(false); setCurrentIndex(p => Math.max(p - 1, 0)); };
  const handleSkipToStart = () => { setIsPlaying(false); setCurrentIndex(0); };
  const handleSkipToEnd = () => { setIsPlaying(false); setCurrentIndex(bars.length - 1); };
  const handleSeek = (i) => setCurrentIndex(i);

  const handleDateNav = (dir) => {
    const idx = availableDates.indexOf(selectedDate);
    const newIdx = idx + dir;
    if (newIdx >= 0 && newIdx < availableDates.length) setSelectedDate(availableDates[newIdx]);
  };

  const handleOpenPosition = (order) => {
    const spec = CONTRACTS[order.symbol];
    setPositions(prev => [...prev, {
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      entryPrice: order.price,
      type: order.type,
      time: bars[currentIndex]?.time || Date.now() / 1000,
      tickSize: spec.tickSize,
      tickValue: spec.tickValue,
    }]);
  };

  const handleClosePosition = (index, currentPrice) => {
    const pos = positions[index];
    const pnl = pos.side === 'long'
      ? (currentPrice - pos.entryPrice) * pos.qty * pos.tickValue / pos.tickSize
      : (pos.entryPrice - currentPrice) * pos.qty * pos.tickValue / pos.tickSize;

    setTrades(prev => [...prev, {
      ...pos, exitPrice: currentPrice, pnl,
      exitTime: bars[currentIndex]?.time || Date.now() / 1000,
    }]);
    setPositions(prev => prev.filter((_, i) => i !== index));
    setAccount(prev => ({
      balance: prev.balance + pnl,
      equity: prev.balance + pnl,
      totalPnl: prev.totalPnl + pnl,
    }));
  };

  const currentBar = bars[currentIndex];
  const spec = CONTRACTS[symbol];

  return (
    <>
      <Head>
        <title>AnooReplay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app-layout">
        <div className="app-sidebar">
          <Link href="/" className="sidebar-logo" title="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <div className="sidebar-divider" />
          <Link href="/backtest" className="sidebar-icon active" title="Charts">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </Link>
          <Link href="/journal" className="sidebar-icon" title="Journal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </Link>
        </div>

        <div className="app-main">
          <div className="top-bar">
            <div className="symbol-select">
              {Object.keys(CONTRACTS).map(s => (
                <button key={s} className={`symbol-btn ${symbol === s ? 'active' : ''}`} onClick={() => setSymbol(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="timeframe-select">
              {[
                { l: '1m', s: 60 }, { l: '2m', s: 120 }, { l: '3m', s: 180 },
                { l: '5m', s: 300 }, { l: '15m', s: 900 }, { l: '30m', s: 1800 },
                { l: '1H', s: 3600 }, { l: '4H', s: 14400 }, { l: 'D', s: 86400 },
              ].map(tf => (
                <button key={tf.s} className={`tf-btn ${timeframe === tf.s ? 'active' : ''}`} onClick={() => setTimeframe(tf.s)}>
                  {tf.l}
                </button>
              ))}
            </div>

            <div className="top-bar-spacer" />

            <div className="date-picker">
              <button className="date-nav-btn" onClick={() => handleDateNav(-1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={availableDates[0] || ''}
                max={availableDates[availableDates.length - 1] || ''}
              />
              <button className="date-nav-btn" onClick={() => handleDateNav(1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div className="chart-container">
              {loading ? (
                <div className="loading-overlay">
                  <div className="loading-spinner" />
                </div>
              ) : bars.length === 0 ? (
                <div className="empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span>No data for {selectedDate || 'this date'}</span>
                </div>
              ) : (
                <>
                  <div className="chart-info">
                    <div className="chart-symbol-label">
                      {symbol} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{spec.name}</span>
                    </div>
                    {currentBar && (
                      <>
                        <div className={`chart-price-label ${currentBar.close >= currentBar.open ? 'up' : 'down'}`}>
                          {currentBar.close.toFixed(2)}
                        </div>
                        <div className={`chart-change-label ${currentBar.close >= currentBar.open ? 'up' : 'down'}`}>
                          {currentBar.close >= currentBar.open ? '+' : ''}
                          {(currentBar.close - currentBar.open).toFixed(2)}
                          {'  '}
                          ({((Math.abs(currentBar.close - currentBar.open) / currentBar.open) * 100).toFixed(2)}%)
                        </div>
                        <div className="chart-time-label">
                          {new Date(currentBar.time * 1000).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York'
                          })} ET
                        </div>
                      </>
                    )}
                  </div>
                  <Chart data={bars} currentIndex={currentIndex} symbol={symbol} onCrosshairMove={setCrosshair} />
                </>
              )}
            </div>

            <TradingPanel
              symbol={symbol}
              currentPrice={currentBar?.close}
              positions={positions}
              onOpenPosition={handleOpenPosition}
              onClosePosition={handleClosePosition}
              account={account}
            />
          </div>

          <ReplayControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onStepForward={handleStepForward}
            onStepBack={handleStepBack}
            onSkipToStart={handleSkipToStart}
            onSkipToEnd={handleSkipToEnd}
            onReset={handleSkipToStart}
            speed={speed}
            onSpeedChange={setSpeed}
            currentIndex={currentIndex}
            totalBars={bars.length}
            onSeek={handleSeek}
            currentTime={currentBar?.time}
          />
        </div>
      </div>
    </>
  );
}
