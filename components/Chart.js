import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';

const DEFAULT_SETTINGS = {
  bgColor: '#000000',
  gridColor: '#141414',
  textColor: '#52525b',
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickUp: '#26a69a',
  wickDown: '#ef5350',
};

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}  ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ET`;
}

export default function Chart({
  data, currentIndex, onCrosshairMove,
  positions = [], trades = [], showMarks = true,
  chartSettings, activeDrawing, drawings = [], onDrawingAdd,
  symbol, timeframe,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);
  const cursorLineRef = useRef(null);
  const markersApiRef = useRef(null);
  const priceLinesRef = useRef([]);
  const drawingLinesRef = useRef(null);
  const drawingLinesArray = useRef([]);
  const [drawingState, setDrawingState] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [crosshairData, setCrosshairData] = useState(null);

  const settings = { ...DEFAULT_SETTINGS, ...chartSettings };

  // Countdown timer
  useEffect(() => {
    const intervalMs = (timeframe || 60) * 1000;
    if (intervalMs >= 86400000) { setCountdown(''); return; }
    const tick = () => {
      const now = Date.now();
      const bucket = Math.floor(now / intervalMs) * intervalMs;
      const remaining = Math.max(0, (bucket + intervalMs - now) / 1000);
      setCountdown(formatCountdown(remaining));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeframe]);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: settings.bgColor },
        textColor: settings.textColor,
        fontFamily: "'SF Mono', 'Fira Code', ui-monospace, Menlo, Monaco, Consolas, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: settings.gridColor, style: 1 },
        horzLines: { color: settings.gridColor, style: 1 },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: 2, labelBackgroundColor: '#1c1c1c' },
        horzLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: 2, labelBackgroundColor: '#1c1c1c' },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: settings.upColor,
      downColor: settings.downColor,
      borderUpColor: settings.upColor,
      borderDownColor: settings.downColor,
      wickUpColor: settings.wickUp,
      wickDownColor: settings.wickDown,
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    try { markersApiRef.current = createSeriesMarkers(candle, []); } catch (e) { markersApiRef.current = null; }

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;

    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time) {
          const d = param.seriesData.get(candle);
          if (d) {
            onCrosshairMove({ time: param.time, ...d });
            setCrosshairData({ time: param.time, ...d });
          }
        }
      });
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update chart settings when they change
  useEffect(() => {
    if (!chartRef.current || !candleRef.current || !volumeRef.current) return;
    chartRef.current.applyOptions({
      layout: { background: { color: settings.bgColor }, textColor: settings.textColor },
      grid: { vertLines: { color: settings.gridColor }, horzLines: { color: settings.gridColor } },
    });
    candleRef.current.applyOptions({
      upColor: settings.upColor, downColor: settings.downColor,
      borderUpColor: settings.upColor, borderDownColor: settings.downColor,
      wickUpColor: settings.wickUp, wickDownColor: settings.wickDown,
    });
  }, [settings.bgColor, settings.gridColor, settings.textColor, settings.upColor, settings.downColor, settings.wickUp, settings.wickDown]);

  // ALWAYS show ALL data — never slice. Cursor is a separate marker.
  useEffect(() => {
    if (!data || !candleRef.current || !volumeRef.current) return;
    if (data.length === 0) return;

    candleRef.current.setData(data.map(b => ({
      time: b.time, open: b.open, high: b.high, low: b.low, close: b.close,
    })));

    volumeRef.current.setData(data.map(b => ({
      time: b.time,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(38,166,154,0.2)' : 'rgba(239,83,80,0.2)',
    })));

    if (currentIndex >= 0 && currentIndex < data.length && chartRef.current) {
      chartRef.current.timeScale().scrollToPosition(10, false);
    }
  }, [data]);

  // Replay cursor — price line that moves with currentIndex
  useEffect(() => {
    if (!candleRef.current || !data || data.length === 0) return;
    if (currentIndex < 0 || currentIndex >= data.length) return;

    if (cursorLineRef.current) {
      try { candleRef.current.removePriceLine(cursorLineRef.current); } catch (e) {}
      cursorLineRef.current = null;
    }

    const bar = data[currentIndex];
    cursorLineRef.current = candleRef.current.createPriceLine({
      price: bar.close,
      color: '#2962ff',
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: '',
      axisLabelColor: '#2962ff',
      axisLabelTextColor: '#ffffff',
    });

    if (chartRef.current) {
      const ts = chartRef.current.timeScale();
      const visibleRange = ts.getVisibleLogicalRange();
      if (visibleRange) {
        if (currentIndex > visibleRange.to - 10 || currentIndex < visibleRange.from + 10) {
          ts.scrollToPosition(Math.floor(data.length - currentIndex - 20), false);
        }
      } else {
        ts.scrollToPosition(Math.floor(data.length - currentIndex - 20), false);
      }
    }
  }, [data, currentIndex]);

  // Trade markers
  useEffect(() => {
    if (!markersApiRef.current || !data || data.length === 0) return;

    const markers = [];
    if (showMarks) {
      for (const t of trades) {
        markers.push({
          time: t.time, position: t.side === 'long' ? 'belowBar' : 'aboveBar',
          color: t.side === 'long' ? '#26a69a' : '#ef5350',
          shape: t.side === 'long' ? 'arrowUp' : 'arrowDown',
          text: `${t.side === 'long' ? 'B' : 'S'} ${t.qty}`, size: 1,
        });
        if (t.exitTime) {
          markers.push({
            time: t.exitTime, position: t.side === 'long' ? 'aboveBar' : 'belowBar',
            color: t.pnl >= 0 ? '#26a69a' : '#ef5350',
            shape: 'circle',
            text: `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)}`, size: 1,
          });
        }
      }
      for (const p of positions) {
        markers.push({
          time: p.time, position: p.side === 'long' ? 'belowBar' : 'aboveBar',
          color: p.side === 'long' ? '#26a69a' : '#ef5350',
          shape: p.side === 'long' ? 'arrowUp' : 'arrowDown',
          text: `${p.side === 'long' ? 'B' : 'S'} ${p.qty}`, size: 1,
        });
      }
      markers.sort((a, b) => a.time - b.time);
    }
    try { markersApiRef.current.setMarkers(markers); } catch (e) {}
  }, [trades, positions, showMarks]);

  // Position entry price lines
  useEffect(() => {
    if (!candleRef.current) return;
    for (const pl of priceLinesRef.current) {
      try { candleRef.current.removePriceLine(pl); } catch (e) {}
    }
    priceLinesRef.current = [];
    for (const p of positions) {
      const line = candleRef.current.createPriceLine({
        price: p.entryPrice,
        color: p.side === 'long' ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${p.side === 'long' ? 'LONG' : 'SHORT'} ${p.qty} @ ${p.entryPrice.toFixed(2)}`,
        axisLabelColor: p.side === 'long' ? '#26a69a' : '#ef5350',
        axisLabelTextColor: '#ffffff',
      });
      priceLinesRef.current.push(line);
    }
  }, [positions]);

  // User drawings
  useEffect(() => {
    if (!candleRef.current) return;
    for (const pl of drawingLinesArray.current) {
      try { candleRef.current.removePriceLine(pl); } catch (e) {}
    }
    drawingLinesArray.current = [];
    for (const d of drawings) {
      if (d.type === 'hline') {
        const line = candleRef.current.createPriceLine({
          price: d.price, color: d.color || '#2962ff', lineWidth: 1, lineStyle: 0,
          axisLabelVisible: true, title: d.label || '',
          axisLabelColor: d.color || '#2962ff',
          axisLabelTextColor: '#ffffff',
        });
        drawingLinesArray.current.push(line);
      } else if (d.type === 'longpos' || d.type === 'shortpos') {
        const isLong = d.type === 'longpos';
        const tpLine = candleRef.current.createPriceLine({
          price: d.entry + (isLong ? 1 : -1) * d.tpTicks * 0.25, color: '#26a69a', lineWidth: 1, lineStyle: 2,
          axisLabelVisible: true, title: 'TP', axisLabelColor: '#26a69a', axisLabelTextColor: '#ffffff',
        });
        const slLine = candleRef.current.createPriceLine({
          price: d.entry + (isLong ? -1 : 1) * d.slTicks * 0.25, color: '#ef5350', lineWidth: 1, lineStyle: 2,
          axisLabelVisible: true, title: 'SL', axisLabelColor: '#ef5350', axisLabelTextColor: '#ffffff',
        });
        const entryLine = candleRef.current.createPriceLine({
          price: d.entry, color: isLong ? '#26a69a' : '#ef5350', lineWidth: 2, lineStyle: 0,
          axisLabelVisible: true, title: isLong ? 'LONG' : 'SHORT',
          axisLabelColor: isLong ? '#26a69a' : '#ef5350', axisLabelTextColor: '#ffffff',
        });
        drawingLinesArray.current.push(tpLine, slLine, entryLine);
      } else if (d.type === 'fib') {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const range = d.high - d.low;
        for (const l of levels) {
          const price = d.low + range * l;
          const line = candleRef.current.createPriceLine({
            price, color: '#a78bfa', lineWidth: 1, lineStyle: 2,
            axisLabelVisible: true, title: `${(l * 100).toFixed(1)}%`,
            axisLabelColor: '#a78bfa', axisLabelTextColor: '#ffffff',
          });
          drawingLinesArray.current.push(line);
        }
      } else if (d.type === 'rect') {
        const topLine = candleRef.current.createPriceLine({
          price: d.top, color: '#2962ff', lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: '',
        });
        const botLine = candleRef.current.createPriceLine({
          price: d.bottom, color: '#2962ff', lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: '',
        });
        drawingLinesArray.current.push(topLine, botLine);
      }
    }
  }, [drawings]);

  // Drawing tool — click to place
  const handleClick = useCallback((e) => {
    if (!activeDrawing || activeDrawing === 'crosshair' || !chartRef.current || !candleRef.current || !data) return;
    if (currentIndex < 0 || currentIndex >= data.length) return;

    const rect = containerRef.current.getBoundingClientRect();
    const series = candleRef.current;
    const y = e.clientY - rect.top;
    const price = series.coordinateToPrice(y);

    if (activeDrawing === 'hline') {
      onDrawingAdd({ type: 'hline', price, color: '#2962ff', label: '' });
    } else if (activeDrawing === 'longpos' || activeDrawing === 'shortpos') {
      onDrawingAdd({ type: activeDrawing, entry: price, tpTicks: 100, slTicks: 75 });
    } else if (activeDrawing === 'fib') {
      if (!drawingState) {
        setDrawingState({ type: 'fib', high: price });
      } else {
        onDrawingAdd({ type: 'fib', high: Math.max(drawingState.high, price), low: Math.min(drawingState.high, price) });
        setDrawingState(null);
      }
    } else if (activeDrawing === 'rect') {
      if (!drawingState) {
        setDrawingState({ type: 'rect', top: price });
      } else {
        onDrawingAdd({ type: 'rect', top: Math.max(drawingState.top, price), bottom: Math.min(drawingState.top, price) });
        setDrawingState(null);
      }
    } else if (activeDrawing === 'trend') {
      if (!drawingState) {
        setDrawingState({ type: 'trend', price, time: data[currentIndex]?.time });
      } else {
        onDrawingAdd({ type: 'hline', price, color: '#a78bfa', label: 'Trend' });
        setDrawingState(null);
      }
    }
  }, [activeDrawing, data, currentIndex, drawingState, onDrawingAdd]);

  // Right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (!containerRef.current || !chartRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const price = candleRef.current ? candleRef.current.coordinateToPrice(y) : 0;
    setCtxMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      price,
    });
  }, []);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const menuAction = (action) => {
    if (action === 'reset' && chartRef.current) {
      chartRef.current.timeScale().resetData();
      chartRef.current.timeScale().scrollToRealTime();
    } else if (action === 'copyPrice') {
      const p = ctxMenu?.price;
      if (p != null && navigator.clipboard) {
        navigator.clipboard.writeText(p.toFixed(2));
      }
    }
    setCtxMenu(null);
  };

  const currentBar = data && currentIndex >= 0 && currentIndex < data.length ? data[currentIndex] : null;
  const isUp = currentBar && currentBar.close >= currentBar.open;
  const change = currentBar ? currentBar.close - currentBar.open : 0;
  const changePct = currentBar ? (Math.abs(change) / currentBar.open) * 100 : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: activeDrawing && activeDrawing !== 'crosshair' ? 'crosshair' : 'default' }}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      />

      {/* OHLCV Legend */}
      {currentBar && (
        <div className="chart-legend">
          <div>
            <span className="chart-legend-symbol">{symbol}</span>
            <span className="chart-legend-tf">{timeframe ? (timeframe >= 3600 ? `${timeframe / 3600}H` : timeframe >= 86400 ? 'D' : `${timeframe / 60}m`) : '1m'}</span>
          </div>
          <div className="chart-ohlcv">
            <span className="lbl">O</span>
            <span className={`val ${isUp ? 'up' : 'down'}`}>{(crosshairData || currentBar).open?.toFixed(2)}</span>
            <span className="lbl">H</span>
            <span className={`val ${isUp ? 'up' : 'down'}`}>{(crosshairData || currentBar).high?.toFixed(2)}</span>
            <span className="lbl">L</span>
            <span className={`val ${isUp ? 'up' : 'down'}`}>{(crosshairData || currentBar).low?.toFixed(2)}</span>
            <span className="lbl">C</span>
            <span className={`val ${isUp ? 'up' : 'down'}`}>{(crosshairData || currentBar).close?.toFixed(2)}</span>
            <span className={`val ${change >= 0 ? 'up' : 'down'}`}>
              {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
          {countdown && (
            <div className="chart-countdown">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {countdown}
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <div className="chart-ctx-menu" style={{ left: Math.min(ctxMenu.x - (containerRef.current?.getBoundingClientRect()?.left || 0), (containerRef.current?.clientWidth || 300) - 200), top: Math.min(ctxMenu.y - (containerRef.current?.getBoundingClientRect()?.top || 0), (containerRef.current?.clientHeight || 200) - 120) }}>
          <button onClick={(e) => { e.stopPropagation(); menuAction('reset'); }}>Reset chart view</button>
          <button onClick={(e) => { e.stopPropagation(); menuAction('copyPrice'); }}>
            Copy price {ctxMenu.price != null ? ctxMenu.price.toFixed(2) : ''}
          </button>
        </div>
      )}

      {/* Drawing state indicator */}
      {drawingState && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <div className="replay-badge">
            <span>Click to set second point</span>
          </div>
        </div>
      )}
    </div>
  );
}
