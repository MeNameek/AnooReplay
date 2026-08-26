import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
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

const DRAWING_GROUPS = [
  {
    id: 'lines', label: 'Lines', icon: 'M4 20L20 4',
    tools: [
      { id: 'crosshair', label: 'Cursor', icon: 'M4 4v16h16M4 12h16M12 4v16' },
      { id: 'trend', label: 'Trend Line', icon: 'M4 20L20 4' },
      { id: 'hline', label: 'Horizontal Line', icon: 'M2 12h20' },
    ],
  },
  {
    id: 'fib', label: 'Fibonacci', icon: 'M2 4h20M2 9.5h20M2 15h20M2 20h20',
    tools: [
      { id: 'fib', label: 'Fib Retracement', icon: 'M2 4h20M2 9.5h20M2 15h20M2 20h20' },
    ],
  },
  {
    id: 'shapes', label: 'Shapes', icon: 'M4 4h16v16H4z',
    tools: [
      { id: 'rect', label: 'Rectangle', icon: 'M4 4h16v16H4z' },
    ],
  },
  {
    id: 'trade', label: 'Trade', icon: 'M12 20V4M8 8l4-4 4 4',
    tools: [
      { id: 'longpos', label: 'Long Position', icon: 'M12 20V4M8 8l4-4 4 4M8 16l4 4 4-4' },
      { id: 'shortpos', label: 'Short Position', icon: 'M12 4v16M8 16l4 4 4-4M8 8l4-4 4 4' },
      { id: 'measure', label: 'Measure', icon: 'M4 4l16 16M20 4L4 20' },
    ],
  },
  {
    id: 'text', label: 'Text', icon: 'M6 4h12M12 4v16M9 20h6',
    tools: [
      { id: 'text', label: 'Text', icon: 'M6 4h12M12 4v16M9 20h6' },
    ],
  },
];

const DEFAULT_CHART_SETTINGS = {
  bgColor: '#000000', gridColor: '#141414', textColor: '#52525b',
  upColor: '#26a69a', downColor: '#ef5350', wickUp: '#26a69a', wickDown: '#ef5350',
};

function ToolButton({ icon, title, active, onClick, children }) {
  return (
    <button className={`tbtn ${active ? 'active' : ''}`} onClick={onClick} title={title}>
      {icon && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>}
      {children}
    </button>
  );
}

export default function Backtest() {
  const router = useRouter();
  const sessionId = router.query.session || null;

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
  const [openFlyout, setOpenFlyout] = useState(null);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState('');

  const flyoutRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [account, setAccount] = useState({ balance: 100000, equity: 100000, totalPnl: 0 });
  const [sessionName, setSessionName] = useState('');

  const intervalRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!router.isReady || !sessionId) return;
    try {
      const raw = localStorage.getItem('anoreplay:session:' + sessionId);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.symbol) setSymbol(s.symbol);
        if (s.balance) setAccount({ balance: s.balance, equity: s.balance, totalPnl: 0 });
        if (s.name) setSessionName(s.name);
        if (s.startDate && s.endDate) {
          setSelectedDate(s.startDate);
        }
        if (s.trades) setTrades(s.trades);
        if (s.positions) setPositions(s.positions);
        if (s.drawings) setDrawings(s.drawings);
      }
    } catch (e) {}
  }, [router.isReady, sessionId]);

  const saveSession = useCallback((updates) => {
    if (!sessionId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const raw = localStorage.getItem('anoreplay:session:' + sessionId);
        if (raw) {
          const s = JSON.parse(raw);
          Object.assign(s, updates);
          localStorage.setItem('anoreplay:session:' + sessionId, JSON.stringify(s));
        }
      } catch (e) {}
    }, 500);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    saveSession({ trades, positions, drawings, currentIndex, symbol, timeframe });
  }, [trades, positions, drawings, currentIndex, symbol, timeframe, sessionId, saveSession]);

  useEffect(() => {
    if (!openFlyout) return;
    const handler = (e) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target)) setOpenFlyout(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openFlyout]);

  useEffect(() => {
    if (!showSymbolDropdown) return;
    const handler = (e) => {
      if (!e.target.closest('.sym-trigger-wrap')) setShowSymbolDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSymbolDropdown]);

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

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${symbol}/dates.json`)
      .then(r => r.json())
      .then(dates => {
        setAvailableDates(dates);
        if (dates.length > 0 && !selectedDate) {
          const mid = dates[Math.floor(dates.length * 0.6)];
          setSelectedDate(mid);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

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
      setCurrentIndex(0);
      setLoading(false);
    }).catch(() => { setBars([]); setLoading(false); });
  }, [selectedDate, symbol, timeframe, aggregateBars, availableDates]);

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

  const handlePlayPause = () => {
    if (currentIndex >= bars.length - 1) setCurrentIndex(0);
    setIsPlaying(p => !p);
  };
  const handleStepForward = () => { setIsPlaying(false); setCurrentIndex(p => Math.min(p + 1, bars.length - 1)); };
  const handleStepBack = () => { setIsPlaying(false); setCurrentIndex(p => Math.max(p - 1, 0)); };
  const handleSkipToStart = () => { setIsPlaying(false); setCurrentIndex(0); };
  const handleSkipToEnd = () => { setIsPlaying(false); setCurrentIndex(bars.length - 1); };
  const handleSeek = (i) => { setCurrentIndex(i); };

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

  const filteredSymbols = Object.keys(CONTRACTS).filter(s =>
    s.toLowerCase().includes(symbolFilter.toLowerCase()) ||
    (CONTRACTS[s].name || '').toLowerCase().includes(symbolFilter.toLowerCase())
  );

  const activeDrawingIcon = DRAWING_GROUPS.flatMap(g => g.tools).find(t => t.id === drawingTool);

  return (
    <>
      <Head>
        <title>AnooReplay{sessionName ? ` — ${sessionName}` : ''}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={chartSettings} onUpdate={setChartSettings} />

      <div className="app-layout">
        <div className="app-sidebar">
          <Link href="/sessions" className="sidebar-icon" title="Sessions" style={{ marginBottom: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <div className="sidebar-divider" />

          {DRAWING_GROUPS.map(group => {
            const isActive = group.tools.some(t => t.id === drawingTool);
            const activeTool = group.tools.find(t => t.id === drawingTool);
            return (
              <div key={group.id} style={{ position: 'relative' }} ref={openFlyout === group.id ? flyoutRef : undefined}>
                <button
                  className={`sidebar-icon ${isActive ? 'active' : ''}`}
                  title={group.label}
                  onClick={() => setOpenFlyout(openFlyout === group.id ? null : group.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {isActive && activeTool ? (
                      <path d={activeTool.icon} />
                    ) : (
                      <path d={group.icon} />
                    )}
                  </svg>
                </button>
                {openFlyout === group.id && (
                  <div className="drawing-flyout">
                    {group.tools.map(tool => (
                      <button
                        key={tool.id}
                        className={`drawing-flyout-item ${drawingTool === tool.id ? 'active' : ''}`}
                        onClick={() => {
                          setDrawingTool(drawingTool === tool.id ? 'crosshair' : tool.id);
                          setOpenFlyout(null);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={tool.icon} />
                        </svg>
                        {tool.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="sidebar-divider" />
          <button className="sidebar-icon" title="Clear drawings" onClick={() => setDrawings([])}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 10v8M14 10v8"/></svg>
          </button>
          <button className="sidebar-icon" title="Settings" onClick={() => setShowSettings(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>

        <div className="app-main">
          <div className="topbar">
            <div style={{ position: 'relative' }} className="sym-trigger-wrap">
              <button className="sym-trigger" onClick={() => setShowSymbolDropdown(v => !v)}>
                <span>{symbol}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showSymbolDropdown && (
                <div className="sym-dropdown">
                  <input
                    autoFocus placeholder="Search symbols..."
                    value={symbolFilter}
                    onChange={e => setSymbolFilter(e.target.value)}
                  />
                  {filteredSymbols.map(s => (
                    <button key={s} className={`sym-dropdown-item ${s === symbol ? 'active' : ''}`} onClick={() => {
                      setSymbol(s); setShowSymbolDropdown(false); setSymbolFilter('');
                    }}>
                      <span style={{ fontWeight: 600 }}>{s}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{CONTRACTS[s]?.name || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="topbar-divider" />

            {TIMEFRAMES.map(tf => (
              <button key={tf.s} className={`tfbtn ${timeframe === tf.s ? 'active' : ''}`} onClick={() => setTimeframe(tf.s)}>
                {tf.l}
              </button>
            ))}

            <div className="topbar-divider" />

            <div className="date-picker">
              <button className="date-nav-btn" onClick={() => handleDateNav(-1)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={availableDates[0] || ''} max={availableDates[availableDates.length - 1] || ''} />
              <button className="date-nav-btn" onClick={() => handleDateNav(1)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div className="topbar-spacer" />

            {sessionId && sessionName && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-muted)', marginRight: 8 }}>{sessionName}</span>
            )}

            <ToolButton title="Show trade markers" active={showMarks} onClick={() => setShowMarks(p => !p)} icon="M12 2v20M2 12h20" />
            <ToolButton title="Toggle trading panel" active={showPanels} onClick={() => setShowPanels(p => !p)} icon="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            <ToolButton title="Chart settings" onClick={() => setShowSettings(true)} icon="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          </div>

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
                <Chart
                  data={bars} currentIndex={currentIndex}
                  symbol={symbol} timeframe={timeframe}
                  onCrosshairMove={setCrosshair} positions={positions} trades={trades}
                  showMarks={showMarks} chartSettings={chartSettings}
                  activeDrawing={drawingTool === 'crosshair' ? null : drawingTool}
                  drawings={drawings}
                  onDrawingAdd={(d) => setDrawings(prev => [...prev, d])}
                />
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
