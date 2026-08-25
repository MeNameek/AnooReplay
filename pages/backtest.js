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
  const [allBars, setAllBars] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [selectedDate, setSelectedDate] = useState('2024-06-03');
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Load dates when symbol changes
  useEffect(() => {
    setLoading(true);
    fetch(`/data/${symbol}.json`)
      .then(r => r.json())
      .then(data => {
        setAllBars(data);
        const dates = [...new Set(data.map(b => {
          const d = new Date(b.time * 1000);
          return d.toISOString().split('T')[0];
        }))].sort();
        setAvailableDates(dates);
        if (dates.length > 0 && !dates.includes(selectedDate)) {
          setSelectedDate(dates[Math.floor(dates.length / 2)]);
        }
        setLoading(false);
      })
      .catch(() => {
        setAllBars([]);
        setAvailableDates([]);
        setLoading(false);
      });
  }, [symbol]);

  // Filter and aggregate when date/timeframe changes
  useEffect(() => {
    if (allBars.length === 0) return;

    const dayStart = new Date(selectedDate + 'T00:00:00Z').getTime() / 1000;
    const dayEnd = new Date(selectedDate + 'T23:59:59Z').getTime() / 1000;
    const dayBars = allBars.filter(b => b.time >= dayStart && b.time <= dayEnd);
    const aggregated = aggregateBars(dayBars, timeframe);
    setBars(aggregated);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [allBars, selectedDate, timeframe, aggregateBars]);

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
    if (currentIndex >= bars.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentIndex(prev => Math.min(prev + 1, bars.length - 1));
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSkipToStart = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleSkipToEnd = () => {
    setIsPlaying(false);
    setCurrentIndex(bars.length - 1);
  };

  const handleSeek = (index) => {
    setCurrentIndex(index);
  };

  const handleDateNav = (direction) => {
    const idx = availableDates.indexOf(selectedDate);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < availableDates.length) {
      setSelectedDate(availableDates[newIdx]);
    }
  };

  const handleOpenPosition = (order) => {
    const spec = CONTRACTS[order.symbol];
    const pos = {
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      entryPrice: order.price,
      type: order.type,
      time: bars[currentIndex]?.time || Date.now() / 1000,
      tickSize: spec.tickSize,
      tickValue: spec.tickValue,
    };
    setPositions(prev => [...prev, pos]);
  };

  const handleClosePosition = (index, currentPrice) => {
    const pos = positions[index];
    const pnl = pos.side === 'long'
      ? (currentPrice - pos.entryPrice) * pos.qty * pos.tickValue / pos.tickSize
      : (pos.entryPrice - currentPrice) * pos.qty * pos.tickValue / pos.tickSize;

    const trade = {
      ...pos,
      exitPrice: currentPrice,
      pnl,
      exitTime: bars[currentIndex]?.time || Date.now() / 1000,
    };

    setTrades(prev => [...prev, trade]);
    setPositions(prev => prev.filter((_, i) => i !== index));
    setAccount(prev => ({
      ...prev,
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
        <title>AnooReplay — Backtest</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app-layout">
        <div className="app-sidebar">
          <Link href="/" className="sidebar-icon" title="Home">🏠</Link>
          <Link href="/backtest" className="sidebar-icon active" title="Charts">📊</Link>
          <Link href="/journal" className="sidebar-icon" title="Journal">📒</Link>
        </div>

        <div className="app-main">
          <div className="top-bar">
            <div className="symbol-select">
              {Object.keys(CONTRACTS).map(s => (
                <button
                  key={s}
                  className={`symbol-btn ${symbol === s ? 'active' : ''}`}
                  onClick={() => setSymbol(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="timeframe-select">
              {[
                { label: '1m', seconds: 60 },
                { label: '2m', seconds: 120 },
                { label: '3m', seconds: 180 },
                { label: '5m', seconds: 300 },
                { label: '15m', seconds: 900 },
                { label: '30m', seconds: 1800 },
                { label: '1H', seconds: 3600 },
                { label: '4H', seconds: 14400 },
                { label: 'D', seconds: 86400 },
              ].map(tf => (
                <button
                  key={tf.seconds}
                  className={`tf-btn ${timeframe === tf.seconds ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf.seconds)}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="top-bar-spacer" />

            <div className="date-picker">
              <button className="date-nav-btn" onClick={() => handleDateNav(-1)}>◀</button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={availableDates[0] || ''}
                max={availableDates[availableDates.length - 1] || ''}
              />
              <button className="date-nav-btn" onClick={() => handleDateNav(1)}>▶</button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div className="chart-container">
              {loading ? (
                <div className="loading-overlay">
                  <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" />
                    <div className="loading-text">Loading {symbol} data...</div>
                  </div>
                </div>
              ) : bars.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📉</div>
                  <div>No data for {selectedDate}</div>
                  <div style={{ fontSize: '11px' }}>Try another date</div>
                </div>
              ) : (
                <>
                  <div className="chart-info">
                    <div className="chart-symbol-label">{symbol} — {spec.name}</div>
                    {currentBar && (
                      <>
                        <div className={`chart-price-label ${currentBar.close >= currentBar.open ? 'up' : 'down'}`}>
                          {currentBar.close.toFixed(2)}
                        </div>
                        <div className={`chart-change-label ${currentBar.close >= currentBar.open ? 'up' : 'down'}`}>
                          {currentBar.close >= currentBar.open ? '▲' : '▼'}{' '}
                          {Math.abs(currentBar.close - currentBar.open).toFixed(2)}{' '}
                          ({((Math.abs(currentBar.close - currentBar.open) / currentBar.open) * 100).toFixed(2)}%)
                        </div>
                        <div className="chart-time-label">
                          {new Date(currentBar.time * 1000).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                  <Chart
                    data={bars}
                    currentIndex={currentIndex}
                    symbol={symbol}
                    onCrosshairMove={setCrosshair}
                  />
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
