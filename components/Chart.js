import { useEffect, useRef, useCallback } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ data, currentIndex, symbol, onCrosshairMove }) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0a0b' },
        textColor: '#94949e',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a1a1e' },
        horzLines: { color: '#1a1a1e' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#333340',
          width: 1,
          style: 2,
          labelBackgroundColor: '#222228',
        },
        horzLine: {
          color: '#333340',
          width: 1,
          style: 2,
          labelBackgroundColor: '#222228',
        },
      },
      timeScale: {
        borderColor: '#2a2a30',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: '#2a2a30',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time) {
          const data = param.seriesData.get(candlestickSeries);
          if (data) {
            onCrosshairMove({
              time: param.time,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
            });
          }
        }
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    handleResize();

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [onCrosshairMove]);

  useEffect(() => {
    if (!data || !seriesRef.current || !volumeSeriesRef.current) return;

    const visibleData = data.slice(0, currentIndex + 1);

    const candleData = visibleData.map(bar => ({
      time: bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    const volData = visibleData.map(bar => ({
      time: bar.time,
      value: bar.volume,
      color: bar.close >= bar.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
    }));

    seriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volData);

    if (chartRef.current && currentIndex >= data.length - 1) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [data, currentIndex]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
