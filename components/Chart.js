import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';

const DEFAULT_SETTINGS = {
  bgColor: '#09090b',
  gridColor: '#18181b',
  textColor: '#52525b',
  upColor: '#22c55e',
  downColor: '#ef4444',
  wickUp: '#22c55e',
  wickDown: '#ef4444',
};

export default function Chart({
  data, currentIndex, onCrosshairMove,
  positions = [], trades = [], showMarks = true,
  chartSettings, activeDrawing, drawings = [], onDrawingAdd,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);
  const cursorLineRef = useRef(null);
  const markersApiRef = useRef(null);
  const priceLinesRef = useRef([]);
  const drawingLinesRef = useRef([]);
  const [drawingState, setDrawingState] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  const settings = { ...DEFAULT_SETTINGS, ...chartSettings };

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: settings.bgColor },
        textColor: settings.textColor,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: { vertLines: { color: settings.gridColor }, horzLines: { color: settings.gridColor } },
      crosshair: {
        mode: 0,
        vertLine: { color: '#27272a', width: 1, style: 2, labelBackgroundColor: '#1f1f23' },
        horzLine: { color: '#27272a', width: 1, style: 2, labelBackgroundColor: '#1f1f23' },
      },
      timeScale: { borderColor: '#27272a', timeVisible: true, secondsVisible: false, barSpacing: 8, rightOffset: 5 },
      rightPriceScale: { borderColor: '#27272a', scaleMargins: { top: 0.08, bottom: 0.22 } },
      handleScroll: true, handleScale: true,
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: settings.upColor, downColor: settings.downColor,
      borderUpColor: settings.upColor, borderDownColor: settings.downColor,
      wickUpColor: settings.wickUp, wickDownColor: settings.wickDown,
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, priceScaleId: 'vol',
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
          if (d) onCrosshairMove({ time: param.time, ...d });
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
      color: b.close >= b.open ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
    })));

    // Scroll to current position
    if (currentIndex >= 0 && currentIndex < data.length && chartRef.current) {
      const time = data[currentIndex].time;
      chartRef.current.timeScale().scrollToPosition(10, false);
    }
  }, [data]);

  // Replay cursor — price line that moves with currentIndex
  useEffect(() => {
    if (!candleRef.current || !data || data.length === 0) return;
    if (currentIndex < 0 || currentIndex >= data.length) return;

    // Remove old cursor
    if (cursorLineRef.current) {
      try { candleRef.current.removePriceLine(cursorLineRef.current); } catch (e) {}
      cursorLineRef.current = null;
    }

    const bar = data[currentIndex];
    cursorLineRef.current = candleRef.current.createPriceLine({
      price: bar.close,
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: '',
    });

    // Follow with visible time
    if (chartRef.current) {
      const ts = chartRef.current.timeScale();
      const visibleRange = ts.getVisibleLogicalRange();
      if (visibleRange) {
        const mid = (visibleRange.from + visibleRange.to) / 2;
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
          color: t.side === 'long' ? '#22c55e' : '#ef4444',
          shape: t.side === 'long' ? 'arrowUp' : 'arrowDown',
          text: `${t.side === 'long' ? 'B' : 'S'} ${t.qty}`, size: 1,
        });
        if (t.exitTime) {
          markers.push({
            time: t.exitTime, position: t.side === 'long' ? 'aboveBar' : 'belowBar',
            color: t.pnl >= 0 ? '#22c55e' : '#ef4444',
            shape: t.side === 'long' ? 'arrowDown' : 'arrowUp',
            text: `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)}`, size: 1,
          });
        }
      }
      for (const p of positions) {
        markers.push({
          time: p.time, position: p.side === 'long' ? 'belowBar' : 'aboveBar',
          color: p.side === 'long' ? '#22c55e' : '#ef4444',
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
        price: p.entryPrice, color: p.side === 'long' ? '#22c55e' : '#ef4444',
        lineWidth: 1, lineStyle: 2, axisLabelVisible: true,
        title: `${p.side === 'long' ? 'LONG' : 'SHORT'} ${p.qty} @ ${p.entryPrice.toFixed(2)}`,
      });
      priceLinesRef.current.push(line);
    }
  }, [positions]);

  // User drawings (price lines for hlines, etc)
  useEffect(() => {
    if (!candleRef.current) return;
    for (const pl of drawingLinesRef.current) {
      try { candleRef.current.removePriceLine(pl); } catch (e) {}
    }
    drawingLinesRef.current = [];
    for (const d of drawings) {
      if (d.type === 'hline') {
        const line = candleRef.current.createPriceLine({
          price: d.price, color: d.color || '#f59e0b', lineWidth: 1, lineStyle: 0,
          axisLabelVisible: true, title: d.label || '',
        });
        drawingLinesRef.current.push(line);
      } else if (d.type === 'longpos' || d.type === 'shortpos') {
        const isLong = d.type === 'longpos';
        const tpLine = candleRef.current.createPriceLine({
          price: d.entry + (isLong ? 1 : -1) * d.tpTicks * 0.25, color: '#22c55e', lineWidth: 1, lineStyle: 2,
          axisLabelVisible: true, title: 'TP',
        });
        const slLine = candleRef.current.createPriceLine({
          price: d.entry + (isLong ? -1 : 1) * d.slTicks * 0.25, color: '#ef4444', lineWidth: 1, lineStyle: 2,
          axisLabelVisible: true, title: 'SL',
        });
        const entryLine = candleRef.current.createPriceLine({
          price: d.entry, color: isLong ? '#22c55e' : '#ef4444', lineWidth: 2, lineStyle: 0,
          axisLabelVisible: true, title: isLong ? 'LONG' : 'SHORT',
        });
        drawingLinesRef.current.push(tpLine, slLine, entryLine);
      } else if (d.type === 'fib') {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const range = d.high - d.low;
        for (const l of levels) {
          const price = d.low + range * l;
          const line = candleRef.current.createPriceLine({
            price, color: '#a78bfa', lineWidth: 1, lineStyle: 2,
            axisLabelVisible: true, title: `${(l * 100).toFixed(1)}%`,
          });
          drawingLinesRef.current.push(line);
        }
      } else if (d.type === 'rect') {
        const topLine = candleRef.current.createPriceLine({
          price: d.top, color: '#f59e0b', lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: '',
        });
        const botLine = candleRef.current.createPriceLine({
          price: d.bottom, color: '#f59e0b', lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: '',
        });
        drawingLinesRef.current.push(topLine, botLine);
      }
    }
  }, [drawings]);

  // Drawing tool — click to place
  const handleClick = useCallback((e) => {
    if (!activeDrawing || !chartRef.current || !candleRef.current || !data) return;
    if (currentIndex < 0 || currentIndex >= data.length) return;

    const rect = containerRef.current.getBoundingClientRect();
    const chart = chartRef.current;
    const series = candleRef.current;

    // Get price at click
    const y = e.clientY - rect.top;
    const price = series.coordinateToPrice(y);

    if (activeDrawing === 'hline') {
      onDrawingAdd({ type: 'hline', price, color: '#f59e0b', label: '' });
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: activeDrawing ? 'crosshair' : 'default' }}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      />
      {ctxMenu && (
        <div className="chart-ctx-menu" style={{ left: Math.min(ctxMenu.x, (containerRef.current?.clientWidth || 300) - 200), top: Math.min(ctxMenu.y, (containerRef.current?.clientHeight || 200) - 120) }}>
          <button onClick={(e) => { e.stopPropagation(); menuAction('reset'); }}>Reset chart view</button>
          <button onClick={(e) => { e.stopPropagation(); menuAction('copyPrice'); }}>
            Copy price {ctxMenu.price != null ? ctxMenu.price.toFixed(2) : ''}
          </button>
        </div>
      )}
    </div>
  );
}
