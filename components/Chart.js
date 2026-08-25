import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

export default function Chart({ data, currentIndex, onCrosshairMove }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);
  const prevIndexRef = useRef(-1);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#09090b' },
        textColor: '#52525b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#27272a', width: 1, style: 2, labelBackgroundColor: '#1f1f23' },
        horzLine: { color: '#27272a', width: 1, style: 2, labelBackgroundColor: '#1f1f23' },
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
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });

    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

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
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update data when currentIndex changes
  useEffect(() => {
    if (!data || !candleRef.current || !volumeRef.current) return;
    if (currentIndex < 0 || currentIndex >= data.length) return;

    const visible = data.slice(0, currentIndex + 1);

    candleRef.current.setData(visible.map(b => ({
      time: b.time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    })));

    volumeRef.current.setData(visible.map(b => ({
      time: b.time,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
    })));

    // Auto-scroll to latest bar
    if (currentIndex >= data.length - 3 && chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }

    prevIndexRef.current = currentIndex;
  }, [data, currentIndex]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
