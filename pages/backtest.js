import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ReplayControls from '../components/ReplayControls';
import TradingPanel from '../components/TradingPanel';
import SettingsModal from '../components/SettingsModal';
import { CONTRACTS } from '../lib/contracts';

const Chart = dynamic(() => import('../components/Chart'), { ssr: false });

const TIMEFRAMES = [
  { l: '1m', s: 60 }, { l: '2m', s: 120 }, { l: '3m', s: 180 },
  { l: '5m', s: 300 }, { l: '15m', s: 900 }, { l: '30m', s: 1800 },
  { l: '1H', s: 3600 }, { l: '4H', s: 14400 }, { l: 'D', s: 86400 },
];

const DRAWING_TOOLS = [
  { id: 'crosshair', label: 'Crosshair', icon: 'M4 4v16h16M4 12h16M12 4v16' },
  { id: 'trend', label: 'Trend Line', icon: 'M4 20L20 4' },
  { id: 'hline', label: 'Horizontal Line', icon: 'M2 12h20' },
  { id: 'fib', label: 'Fibonacci', icon: 'M2 4h20M2 9.5h20M2 15h20M2 20h20' },
  { id: 'rect', label: 'Rectangle', icon: 'M4 4h16v16H4z' },
  { id: 'longpos', label: 'Long Position', icon: 'M12 20V4M8 8l4-4 4 4M8 16l4 4 4-4' },
  { id: 'shortpos', label: 'Short Position', icon: 'M12 4v16M8 16l4 4 4-4M8 8l4-4 4 4' },
  { id: 'measure', label: 'Measure', icon: 'M4 4l16 16M20 4L4 20' },
  { id: 'text', label: 'Text', icon: 'M6 4h12M12 4v16M9 20h6' },
];

const DEFAULT_CHART_SETTINGS = {
  bgColor: '#09090b', gridColor: '#18181b', textColor: '#52525b',
  upColor: '#22c55e', downColor: '#ef4444', wickUp: '#22c55e', wickDown: '#ef4444',
};

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
  const [drawingTool, setDrawingTool] = useState('crosshair');
  const [showPanels, setShowPanels] = useState(true);
  const [showMarks, setShowMarks] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [chartSettings, setChartSettings] = useState(DEFAULT_CHART_SETTINGS);
  const [drawings, setDrawings] = useState([]);

  // Trading
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [account, setAccount] = useState({ balance: 100000, equity: 100000, totalPnl: 0 });

  const intervalRef = useRef(null);

  const aggregateBars = useCallback((rawBars, tfSeconds) => {
    if (tfSeconds === 60) return rawBars;
    const aggregated = [];
    let cur = null;
    for (const bar of rawBars) {
      const t = Math.floor(bar.time / tfSeconds) * tfSeconds;
      if (!cur || cur.time !== t) {
        if (cur) aggregated.push(cur);
        cur = { time: t, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume };
      } else {
        cur.high = Math.max(cur.high, bar.high);
        cur.low = Math.min(cur.low, bar.low);
        cur.close = bar.close;
        cur.volume += bar.volume;
      }
    }
    if (cur) aggregated.push(cur);
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
      .catch(() => setLoading(false));
  }, [symbol]);

  // Fetch bars for selected date + 30 days context
  useEffect(() => {
    if (!selectedDate || availableDates.length === 0) return;
    setLoading(true);
    setIsPlaying(false);
    setDrawings([]);

    const selIdx = availableDates.indexOf(selectedDate);
    const startIdx = Math.max(0, selIdx - 30);
    const contextDates = availableDates.slice(startIdx, selIdx + 1);

    Promise.all(contextDates.map(d =>
      fetch(`/data/${symbol}/${d}.json`).then(r => r.ok ? r.json() : []).catch(() => [])
    )).then(results => {
      const allParsed = [];
      for (const raw of results) {
        if (!raw || raw.length === 0) continue;
        const parsed = Array.isArray(raw[0])
          ? raw.map(([time, open, high, low, close, volume]) => ({ time, open, high, low, close, volume }))
          : raw;
        allParsed.push(...parsed);
      }
      allParsed.sort((a, b) => a.time - b.time);
      const aggregated = aggregateBars(allParsed, timeframe);
      setBars(aggregated);
      setCurrentIndex(aggregated.length - 1);
      setLoading(false);
    }).catch(() => { setBars([]); setLoading(false); });
  }, [selectedDate, symbol, timeframe, aggregateBars, availableDates]);

  // Replay timer — just advances currentIndex, doesn't touch bar visibility
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= bars.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, bars.length]);

  // Controls
  const handlePlayPause = () => {
    if (currentIndex >= bars.length - 1) setCurrentIndex(0);
    setIsPlaying(p => !p);
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
      symbol: order.symbol, side: order.side, qty: order.qty,
      entryPrice: order.price, type: order.type,
      time: bars[currentIndex]?.time || Date.now() / 1000,
      tickSize: spec.tickSize, tickValue: spec.tickValue,
    }]);
  };

  const handleClosePosition = (index, currentPrice) => {
    const pos = positions[index];
    const pnl = pos.side === 'long'
      ? (currentPrice - pos.entryPrice) * pos.qty * pos.tickValue / pos.tickSize
      : (pos.entryPrice - currentPrice) * pos.qty * pos.tickValue / pos.tickSize;
    setTrades(prev => [...prev, { ...pos, exitPrice: currentPrice, pnl, exitTime: bars[currentIndex]?.time || Date.now() / 1000 }]);
    setPositions(prev => prev.filter((_, i) => i !== index));
    setAccount(prev => ({ balance: prev.balance + pnl, equity: prev.balance + pnl, totalPnl: prev.totalPnl + pnl }));
  };

  useEffect(() => {
    window.__toggleExecMarks = () => setShowMarks(p => !p);
    return () => { delete window.__toggleExecMarks; };
  }, []);

  const currentBar = bars[currentIndex];
  const spec = CONTRACTS[symbol];

  return (
    <>
      <Head>
        <title>AnooReplay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={chartSettings} onUpdate={setChartSettings} />

      <div className="app-layout">
        {/* Left toolbar — drawing tools */}
        <div className="app-sidebar">
          <Link href="/" className="sidebar-logo" title="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <div className="sidebar-divider" />
          {DRAWING_TOOLS.map(t => (
            <button key={t.id} className={`sidebar-icon ${drawingTool === t.id ? 'active' : ''}`}
              onClick={() => setDrawingTool(t.id)} title={t.label}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
            </button>
          ))}
          <div className="sidebar-divider" />
          <button className="sidebar-icon" title="Clear drawings" onClick={() => setDrawings([])}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 10v8M14 10v8"/></svg>
          </button>
          <button className="sidebar-icon" title="Settings" onClick={() => setShowSettings(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>

        <div className="app-main">
          {/* Top bar */}
          <div className="top-bar">
            <div className="symbol-select">
              {Object.keys(CONTRACTS).map(s => (
                <button key={s} className={`symbol-btn ${symbol === s ? 'active' : ''}`} onClick={() => setSymbol(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="timeframe-select">
              {TIMEFRAMES.map(tf => (
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
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={availableDates[0] || ''} max={availableDates[availableDates.length - 1] || ''} />
              <button className="date-nav-btn" onClick={() => handleDateNav(1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div className="chart-container">
              {loading ? (
                <div className="loading-overlay"><div className="loading-spinner" /></div>
              ) : bars.length === 0 ? (
                <div className="empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span>No data for {selectedDate || 'this date'}</span>
                </div>
              ) : (
                <>
                  <div className="chart-info">
                    <div className="chart-symbol-label">{symbol} <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>{spec.name}</span></div>
                    {currentBar && (
                      <>
                        <div className={`chart-price-label ${currentBar.close >= currentBar.open ? 'up' : 'down'}`}>{currentBar.close.toFixed(2)}</div>
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
                  <Chart
                    data={bars} currentIndex={currentIndex} symbol={symbol}
                    onCrosshairMove={setCrosshair} positions={positions} trades={trades}
                    showMarks={showMarks} chartSettings={chartSettings}
                    activeDrawing={drawingTool === 'crosshair' ? null : drawingTool}
                    drawings={drawings}
                    onDrawingAdd={(d) => setDrawings(prev => [...prev, d])}
                  />
                </>
              )}
            </div>

            {showPanels && (
              <TradingPanel
                symbol={symbol} currentPrice={currentBar?.close}
                positions={positions} onOpenPosition={handleOpenPosition}
                onClosePosition={handleClosePosition} account={account}
              />
            )}
          </div>

          <ReplayControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onStepForward={handleStepForward}
            onStepBack={handleStepBack}
            onSkipToStart={handleSkipToStart}
            onSkipToEnd={handleSkipToEnd}
            speed={speed} onSpeedChange={setSpeed}
            currentIndex={currentIndex} totalBars={bars.length}
            onSeek={handleSeek} currentTime={currentBar?.time}
          />
        </div>
      </div>
    </>
  );
}
