import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, IChartApi, ISeriesApi } from 'lightweight-charts'
import type { Bar, Drawing } from '../lib/types'

type Props = {
  bars: Bar[]
  cursor: number // index of replay cursor, bars after cursor are future (hidden in replay mode)
  replayMode: boolean
  timeframe: number
  dateKey?: string // increments when user jumps to new date — forces initial 150-bar view like Nami
  drawings: Drawing[]
  activeTool: string | null
  onAddDrawing: (d: Drawing) => void
  onPriceClick?: (price: number, time: number) => void
}

export default function Chart({ bars, cursor, replayMode, timeframe, dateKey, drawings, activeTool, onAddDrawing }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [pending, setPending] = useState<any>(null)
  const isInitialRef = useRef(true)
  const prevBarsRef = useRef<Bar[]>([])
  const prevDateKeyRef = useRef<string | undefined>(undefined)

  // create chart once
  useEffect(() => {
    if (!wrapRef.current) return
    const chart = createChart(wrapRef.current, {
      layout: { background: { color: '#0a0a0a' }, textColor: '#a1a1aa', fontSize: 11, fontFamily: 'Inter, ui-monospace' },
      grid: { vertLines: { color: '#1a1a1a' }, horzLines: { color: '#1a1a1a' } },
      crosshair: { mode: 0 as any },
      timeScale: { borderColor: '#27272a', timeVisible: true, secondsVisible: false, rightOffset: 12, barSpacing: 6 },
      rightPriceScale: { borderColor: '#27272a', scaleMargins: { top: 0.08, bottom: 0.24 }, autoScale: true },
      handleScroll: true,
      handleScale: true,
    })
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#e7e7e7', downColor: '#2a2a2a',
      borderUpColor: '#e7e7e7', borderDownColor: '#2a2a2a',
      wickUpColor: '#e7e7e7', wickDownColor: '#2a2a2a',
    })
    const vol = chart.addSeries(HistogramSeries, { priceScaleId: 'vol', priceFormat: { type: 'volume' } })
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })

    chartRef.current = chart
    candleRef.current = candle
    volRef.current = vol

    const ro = new ResizeObserver(() => {
      if (wrapRef.current) chart.applyOptions({ width: wrapRef.current.clientWidth, height: wrapRef.current.clientHeight })
    })
    ro.observe(wrapRef.current)
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null }
  }, [])

  // set data (replay slice) — Nami-like: preserve zoom/position, don't fitContent on every update
  useEffect(() => {
    if (!candleRef.current || !volRef.current) return
    if (bars.length === 0) { candleRef.current.setData([]); volRef.current.setData([]); prevBarsRef.current = []; return }
    const visible = replayMode ? bars.slice(0, Math.max(1, cursor + 1)) : bars
    const wasInitial = isInitialRef.current
    const barsChanged = prevBarsRef.current !== bars
    const dateChanged = dateKey !== undefined && prevDateKeyRef.current !== undefined && prevDateKeyRef.current !== dateKey

    // capture current visible time window before data change (only for timeframe/switch, not for simple cursor step)
    let prevFromTime: number | null = null
    let prevToTime: number | null = null
    let prevBarSpacing: number | null = null
    if (!wasInitial && barsChanged && chartRef.current && prevBarsRef.current.length) {
      const range = chartRef.current.timeScale().getVisibleLogicalRange()
      const opts: any = chartRef.current.timeScale().options()
      prevBarSpacing = opts.barSpacing
      if (range) {
        // map logical indices to time using previous bars
        const clampedFrom = Math.max(0, Math.min(prevBarsRef.current.length - 1, Math.floor(range.from)))
        const clampedTo = Math.max(0, Math.min(prevBarsRef.current.length - 1, Math.ceil(range.to) - 1))
        prevFromTime = prevBarsRef.current[clampedFrom]?.time ?? null
        prevToTime = prevBarsRef.current[clampedTo]?.time ?? null
      }
    }

    candleRef.current.setData(visible.map(b => ({ time: b.time as any, open: b.open, high: b.high, low: b.low, close: b.close })))
    volRef.current.setData(visible.map(b => ({ time: b.time as any, value: b.volume, color: b.close >= b.open ? 'rgba(231,231,231,0.9)' : 'rgba(113,113,122,0.6)' })))

    if (!chartRef.current) { prevBarsRef.current = bars; prevDateKeyRef.current = dateKey; return }
    if (wasInitial || dateChanged) {
      // like Nami: start centered on ~150 bars ending at cursor (not fitted to 30 days) — see Image 2: ~118 bars visible
      const dataLen = visible.length
      const show = 150 // Nami shows ~120-180 bars at 1m
      const from = Math.max(0, dataLen - show)
      const to = dataLen
      chartRef.current.timeScale().applyOptions({ barSpacing: 7, rightOffset: 8 })
      chartRef.current.timeScale().setVisibleLogicalRange({ from, to })
      isInitialRef.current = false
    } else if (barsChanged && prevFromTime != null && prevToTime != null) {
      // timeframe / date switch: keep same time window and barSpacing (don't reset like before)
      if (prevBarSpacing != null) chartRef.current.timeScale().applyOptions({ barSpacing: prevBarSpacing })
      const findIdx = (t: number, arr: Bar[]) => {
        let lo = 0, hi = arr.length - 1, ans = 0
        while (lo <= hi) {
          const mid = (lo + hi) >> 1
          if (arr[mid].time <= t) { ans = mid; lo = mid + 1 } else hi = mid - 1
        }
        return ans
      }
      const fromIdxNew = Math.min(visible.length - 1, findIdx(prevFromTime!, bars))
      const toIdxNew = Math.min(visible.length, findIdx(prevToTime!, bars) + 1)
      const count = Math.max(10, toIdxNew - fromIdxNew)
      if (count < visible.length * 2) {
        chartRef.current.timeScale().setVisibleLogicalRange({ from: fromIdxNew, to: toIdxNew })
      }
    }
    prevBarsRef.current = bars
    prevDateKeyRef.current = dateKey
    // stepping (cursor only) doesn't reset — follow-cursor effect below handles keeping cursor in view
  }, [bars, cursor, replayMode, dateKey])

  // follow cursor
  useEffect(() => {
    if (!chartRef.current || bars.length === 0) return
    // scroll to keep cursor near right
    const ts = chartRef.current.timeScale()
    const range = ts.getVisibleLogicalRange()
    if (!range) return
    const visible = range.to - range.from
    // if cursor out of view, jump
    if (cursor < range.from + 2 || cursor > range.to - 4) {
      const to = Math.min(bars.length, cursor + Math.floor(visible * 0.2))
      const from = Math.max(0, to - visible)
      ts.setVisibleLogicalRange({ from, to })
    }
  }, [cursor, bars.length])

  // click to create drawings
  const handleChartClick = useCallback((e: React.MouseEvent) => {
    if (!activeTool || activeTool === 'cursor' || !wrapRef.current || !candleRef.current || bars.length === 0) return
    const rect = wrapRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const price = candleRef.current.coordinateToPrice(y)
    if (price == null) return
    // time from x
    let time = bars[cursor]?.time ?? bars[bars.length - 1].time
    if (chartRef.current) {
      const x = e.clientX - rect.left
      const t = chartRef.current.timeScale().coordinateToTime(x) as number | null
      if (t) time = t as number
    }

    if (activeTool === 'hline') {
      onAddDrawing({ id: Math.random().toString(36).slice(2), type: 'hline', price, color: '#2962ff' })
    } else if (activeTool === 'rect') {
      if (!pending) setPending({ type: 'rect', top: price })
      else {
        onAddDrawing({ id: Math.random().toString(36).slice(2), type: 'rect', top: Math.max(pending.top, price), bottom: Math.min(pending.top, price), color: '#2962ff', fill: 'rgba(41,98,255,0.15)' })
        setPending(null)
      }
    } else if (activeTool === 'trend') {
      if (!pending) setPending({ type: 'trend', p1: { time, price } })
      else {
        onAddDrawing({ id: Math.random().toString(36).slice(2), type: 'trend', p1: pending.p1, p2: { time, price }, color: '#2962ff' })
        setPending(null)
      }
    } else if (activeTool === 'fib') {
      if (!pending) setPending({ type: 'fib', p1: { time, price } })
      else {
        onAddDrawing({ id: Math.random().toString(36).slice(2), type: 'fib', p1: pending.p1, p2: { time, price } })
        setPending(null)
      }
    } else if (activeTool === 'long' || activeTool === 'short') {
      const entry = price
      const isLong = activeTool === 'long'
      const sl = entry + (isLong ? -40 : 40)
      const tp = entry + (isLong ? 80 : -80)
      onAddDrawing({ id: Math.random().toString(36).slice(2), type: isLong ? 'long' : 'short', entry, sl, tp })
    }
  }, [activeTool, bars, cursor, pending, onAddDrawing])

  // SVG overlay for drawings that priceLines can't do: rects, trend, fib
  const [overlayKey, setOverlayKey] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setOverlayKey(k => k + 1), 120)
    const onResize = () => setOverlayKey(k => k + 1)
    window.addEventListener('resize', onResize)
    const chart = chartRef.current
    let unsub: any = null
    if (chart) {
      unsub = () => {}
      try { chart.timeScale().subscribeVisibleLogicalRangeChange(() => setOverlayKey(k => k + 1)) } catch {}
    }
    return () => { clearInterval(id); window.removeEventListener('resize', onResize); }
  }, [])

  const overlay = (() => {
    if (!chartRef.current || !candleRef.current || bars.length === 0) return null
    // force re-render on overlayKey
    void overlayKey
    const els: JSX.Element[] = []
    for (const d of drawings) {
      if (d.type === 'rect') {
        const topY = candleRef.current.priceToCoordinate(d.top)
        const botY = candleRef.current.priceToCoordinate(d.bottom)
        if (topY == null || botY == null) continue
        const y = Math.min(topY, botY)
        const h = Math.abs(botY - topY)
        els.push(
          <div key={d.id} style={{ position: 'absolute', left: 0, right: 40, top: y, height: Math.max(2, h), background: d.fill, border: `1px solid ${d.color}`, pointerEvents: 'none' }} />
        )
      } else if (d.type === 'trend') {
        const x1 = chartRef.current.timeScale().timeToCoordinate(d.p1.time as any)
        const x2 = chartRef.current.timeScale().timeToCoordinate(d.p2.time as any)
        const y1 = candleRef.current.priceToCoordinate(d.p1.price)
        const y2 = candleRef.current.priceToCoordinate(d.p2.price)
        if (x1 == null || x2 == null || y1 == null || y2 == null) continue
        els.push(
          <svg key={d.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="100%" height="100%">
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={d.color} strokeWidth={2} />
          </svg>
        )
      } else if (d.type === 'fib') {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
        const high = Math.max(d.p1.price, d.p2.price)
        const low = Math.min(d.p1.price, d.p2.price)
        const range = high - low || 1
        for (const lvl of levels) {
          const price = low + range * lvl
          const y = candleRef.current.priceToCoordinate(price)
          if (y == null) continue
          els.push(
            <div key={d.id + '-' + lvl} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 0, borderTop: '1px dashed #a78bfa', pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', right: 46, top: -8, fontSize: 10, fontFamily: 'monospace', color: '#a78bfa', background: '#0a0a0a', padding: '0 4px' }}>{(lvl * 100).toFixed(1)}% {price.toFixed(2)}</span>
            </div>
          )
        }
      } else if (d.type === 'long' || d.type === 'short') {
        const isLong = d.type === 'long'
        const entryY = candleRef.current.priceToCoordinate(d.entry)
        const slY = candleRef.current.priceToCoordinate(d.sl)
        const tpY = candleRef.current.priceToCoordinate(d.tp)
        if (entryY == null || slY == null || tpY == null) continue
        const top = Math.min(entryY, tpY)
        const bot = Math.max(entryY, slY)
        // entry line + boxes: reuse priceLines for labels, overlay for boxes
        const boxTopH = Math.abs(tpY - entryY)
        const boxBotH = Math.abs(slY - entryY)
        els.push(
          <div key={d.id + 'tp'} style={{ position: 'absolute', left: 0, right: 40, top: isLong ? tpY : entryY, height: boxTopH, background: 'rgba(38,166,154,0.18)', border: '1px solid rgba(38,166,154,0.6)', pointerEvents: 'none' }} />,
          <div key={d.id + 'sl'} style={{ position: 'absolute', left: 0, right: 40, top: isLong ? entryY : slY, height: boxBotH, background: 'rgba(239,83,80,0.18)', border: '1px solid rgba(239,83,80,0.6)', pointerEvents: 'none' }} />,
          <div key={d.id + 'entry'} style={{ position: 'absolute', left: 0, right: 0, top: entryY, height: 0, borderTop: `2px solid ${isLong ? '#26a69a' : '#ef5350'}`, pointerEvents: 'none' }} />
        )
      } else if (d.type === 'hline') {
        const y = candleRef.current.priceToCoordinate(d.price)
        if (y == null) continue
        els.push(<div key={d.id} style={{ position: 'absolute', left: 0, right: 0, top: y, borderTop: `1px solid ${d.color}`, pointerEvents: 'none' }} />)
      }
    }
    return els
  })()

  return (
    <div ref={wrapRef} onClick={handleChartClick} style={{ width: '100%', height: '100%', position: 'relative', cursor: activeTool && activeTool !== 'cursor' ? 'crosshair' : 'default' }}>
      <div style={{ position: 'absolute', inset: 0 }}>{overlay}</div>
      {pending && <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(41,98,255,0.15)', border: '1px solid #2962ff', color: '#2962ff', fontSize: 11, padding: '4px 8px', borderRadius: 6, pointerEvents: 'none' }}>Click to set second point — {pending.type}</div>}
    </div>
  )
}
