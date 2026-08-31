import { useEffect, useState, useCallback, useRef } from 'react'
import Chart from './components/Chart'
import { resample, TIMEFRAMES, type Bar } from './lib/resample'
import type { Drawing } from './lib/types'

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10]

export default function App() {
  const [timeframe, setTimeframe] = useState(60)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [rawBars, setRawBars] = useState<Bar[]>([]) // 1m
  const [bars, setBars] = useState<Bar[]>([]) // resampled
  const [cursor, setCursor] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [replayMode, setReplayMode] = useState(true)
  const [activeTool, setActiveTool] = useState<string>('cursor')
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const timerRef = useRef<number | null>(null)

  // load dates
  useEffect(() => {
    fetch('/data/NQ/dates.json').then(r => r.json()).then((dates: string[]) => {
      setAvailableDates(dates)
      if (dates.length && !selectedDate) {
        // start at ~60% through history like Nami does
        const mid = dates[Math.floor(dates.length * 0.6)]
        setSelectedDate(mid)
      }
    }).catch(() => {})
  }, [])

  // load bars for selected date + 30 days context
  useEffect(() => {
    if (!selectedDate || availableDates.length === 0) return
    const idx = availableDates.indexOf(selectedDate)
    if (idx === -1) return
    const start = Math.max(0, idx - 30)
    const slice = availableDates.slice(start, idx + 1)
    Promise.all(slice.map(d => fetch(`/data/NQ/${d}.json`).then(r => r.ok ? r.json() : []).catch(() => []))).then(results => {
      const all: Bar[] = []
      for (const arr of results) {
        for (const t of arr as any[]) {
          // tuples [time,o,h,l,c,v]
          if (Array.isArray(t)) all.push({ time: t[0], open: t[1], high: t[2], low: t[3], close: t[4], volume: t[5] })
          else all.push(t)
        }
      }
      all.sort((a, b) => a.time - b.time)
      setRawBars(all)
      // init cursor at first bar of selectedDate
      const selStart = new Date(selectedDate + 'T00:00:00Z').getTime() / 1000
      let startCursor = all.findIndex(b => b.time >= selStart)
      if (startCursor === -1) startCursor = Math.max(0, all.length - 300)
      // after resample we will map cursor, so store raw cursor then resample
      // temporarily set, will be updated in resample effect
      ;(window as any).__startCursorTime = all[startCursor]?.time
    })
  }, [selectedDate, availableDates])

  // resample whenever rawBars or timeframe changes, and restore cursor by time
  useEffect(() => {
    const res = resample(rawBars, timeframe)
    setBars(res)
    const targetTime: number | undefined = (window as any).__startCursorTime
    if (targetTime) {
      let idx = res.findIndex(b => b.time >= targetTime)
      if (idx === -1) idx = res.length - 1
      setCursor(idx)
    } else {
      setCursor(res.length - 1)
    }
  }, [rawBars, timeframe])

  // play
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCursor(c => {
          if (c >= bars.length - 1) { setIsPlaying(false); return c }
          return c + 1
        })
      }, 600 / speed) // 1x = 600ms per bar (feels like Nami), 0.5x = 1200ms
    } else if (timerRef.current) clearInterval(timerRef.current)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, speed, bars.length])

  const step = (dir: number) => { setIsPlaying(false); setCursor(c => Math.min(bars.length - 1, Math.max(0, c + dir))) }
  const goToDate = (d: string) => { setIsPlaying(false); setSelectedDate(d) }
  const jumpDays = (n: number) => {
    const i = availableDates.indexOf(selectedDate)
    const ni = Math.min(availableDates.length - 1, Math.max(0, i + n))
    goToDate(availableDates[ni])
  }

  const addDrawing = useCallback((d: Drawing) => setDrawings(prev => [...prev, d]), [])

  const currentBar = bars[cursor]
  const tfLabel = TIMEFRAMES.find(t => t.s === timeframe)?.label ?? `${timeframe/60}m`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a' }}>
      {/* Top bar — like Nami: MNQ1! 1m | Indicators | To latest Go to | <- -> | TF picker | Trade Journal */}
      <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', borderBottom: '1px solid #1a1a1a', background: '#0a0a0a', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
          <span style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>NQ1!</span>
          <span style={{ color: '#71717a', fontSize: 11 }}>Micro E-mini Nasdaq-100</span>
        </div>
        <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.s} onClick={() => setTimeframe(tf.s)} style={{ padding: '3px 7px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', background: timeframe === tf.s ? '#2962ff' : '#1a1a1a', color: timeframe === tf.s ? '#fff' : '#a1a1aa', border: 'none' }}>{tf.label}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
        <button onClick={() => setCursor(bars.length - 1)} style={{ fontSize: 11, color: '#a1a1aa', background: '#1a1a1a', border: 'none', padding: '3px 8px', borderRadius: 6 }}>To latest</button>
        <button onClick={() => { const v = prompt('Go to date YYYY-MM-DD', selectedDate); if (v && availableDates.includes(v)) goToDate(v) }} style={{ fontSize: 11, color: '#a1a1aa', background: '#1a1a1a', border: 'none', padding: '3px 8px', borderRadius: 6 }}>Go to</button>
        <div style={{ display: 'flex', gap: 2, marginLeft: 6 }}>
          <button onClick={() => jumpDays(-1)} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '4px 6px', borderRadius: 6 }}>←</button>
          <button onClick={() => jumpDays(1)} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '4px 6px', borderRadius: 6 }}>→</button>
        </div>
        <input type="date" value={selectedDate} onChange={e => goToDate(e.target.value)} min={availableDates[0]} max={availableDates[availableDates.length-1]} style={{ marginLeft: 6, background: '#1a1a1a', border: '1px solid #27272a', color: '#e5e5e5', borderRadius: 6, padding: '3px 6px', fontSize: 11 }} />
        <div style={{ flex: 1 }} />
        {currentBar && <div style={{ fontFamily: 'monospace', fontSize: 11, color: currentBar.close >= currentBar.open ? '#26a69a' : '#ef5350' }}>{currentBar.close.toFixed(2)} {currentBar.close >= currentBar.open ? '↗' : '↘'}</div>}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a1a1aa' }}><input type="checkbox" checked={replayMode} onChange={e => setReplayMode(e.target.checked)} /> Replay</label>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left toolbar — drawing tools */}
        <div style={{ width: 36, background: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0' }}>
          {[
            { id: 'cursor', icon: '↖', title: 'Cursor' },
            { id: 'trend', icon: '/', title: 'Trend' },
            { id: 'hline', icon: '—', title: 'HLine' },
            { id: 'rect', icon: '▭', title: 'Box' },
            { id: 'fib', icon: 'F', title: 'Fib' },
            { id: 'long', icon: '▲', title: 'Long' },
            { id: 'short', icon: '▼', title: 'Short' },
          ].map(t => (
            <button key={t.id} title={t.title} onClick={() => setActiveTool(t.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: activeTool === t.id ? '#2962ff22' : 'transparent', color: activeTool === t.id ? '#2962ff' : '#71717a', fontSize: 12 }}>
              {t.icon}
            </button>
          ))}
          <div style={{ height: 1, background: '#1a1a1a', width: 18, margin: '4px 0' }} />
          <button onClick={() => setDrawings([])} title="Clear" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#71717a' }}>⌫</button>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {bars.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontFamily: 'monospace', fontSize: 12 }}>Loading {selectedDate}...</div>
          ) : (
            <div style={{ flex: 1, position: 'relative' }}>
              <Chart bars={bars} cursor={cursor} replayMode={replayMode} timeframe={timeframe} drawings={drawings} activeTool={activeTool} onAddDrawing={addDrawing} />
              {/* Nami-style watermark */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 120, fontWeight: 800, color: 'rgba(255,255,255,0.04)', pointerEvents: 'none', letterSpacing: -8 }}>{tfLabel}</div>
            </div>
          )}

          {/* Bottom replay bar — like Nami: Select bar | ▷ > >> | 0.5x 1m | bookmark | date 09:33 ET */}
          <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', borderTop: '1px solid #1a1a1a', background: '#0a0a0a', fontSize: 11 }}>
            <button onClick={() => setCursor(0)} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '4px 7px', borderRadius: 6 }}>⏮</button>
            <button onClick={() => step(-1)} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '4px 7px', borderRadius: 6 }}>◀</button>
            <button onClick={() => setIsPlaying(v => !v)} style={{ background: isPlaying ? '#2962ff' : '#1a1a1a', border: 'none', color: isPlaying ? '#fff' : '#a1a1aa', padding: '4px 10px', borderRadius: 6, minWidth: 48 }}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={() => step(1)} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '4px 7px', borderRadius: 6 }}>▶</button>
            <button onClick={() => setCursor(bars.length - 1)} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '4px 7px', borderRadius: 6 }}>⏭</button>
            <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
            <div style={{ display: 'flex', gap: 2 }}>
              {SPEED_OPTIONS.map(s => (
                <button key={s} onClick={() => setSpeed(s)} style={{ padding: '2px 6px', borderRadius: 6, border: 'none', background: speed === s ? '#2962ff' : '#1a1a1a', color: speed === s ? '#fff' : '#a1a1aa', fontFamily: 'monospace', fontSize: 11 }}>{s}x</button>
              ))}
            </div>
            <div style={{ flex: 1, height: 3, background: '#1a1a1a', borderRadius: 2, position: 'relative', margin: '0 6px', cursor: 'pointer' }} onClick={e => {
              const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              const pct = (e.clientX - r.left) / r.width
              setIsPlaying(false); setCursor(Math.floor(pct * (bars.length - 1)))
            }}>
              <div style={{ width: `${bars.length ? (cursor / (bars.length - 1)) * 100 : 0}%`, height: '100%', background: '#2962ff', borderRadius: 2 }} />
            </div>
            <div style={{ fontFamily: 'monospace', color: '#a1a1aa', minWidth: 200, textAlign: 'right' }}>
              {currentBar ? new Date(currentBar.time * 1000).toLocaleString('en-US', { month: 'short', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' }) + ' ET' : ''} · {cursor + 1} / {bars.length}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a', background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>{tfLabel}</div>
            <button onClick={() => { const v = prompt('Skip to bar index', String(cursor)); if (v) { const n = parseInt(v); if (!isNaN(n)) setCursor(Math.max(0, Math.min(bars.length-1, n))) } }} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', padding: '3px 6px', borderRadius: 6, fontSize: 10 }}>Go bar</button>
          </div>
        </div>

        {/* Right placeholder for future Order/Journal panel */}
        <div style={{ width: 220, background: '#0a0a0a', borderLeft: '1px solid #1a1a1a', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#e5e5e5' }}>NQ · {tfLabel}</div>
          <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>{availableDates.length} days loaded</div>
          <div style={{ height: 1, background: '#1a1a1a' }} />
          <div style={{ fontSize: 11, color: '#a1a1aa' }}>Drawings: {drawings.length}</div>
          <div style={{ fontSize: 10, color: '#71717a' }}>Click chart with tool active to draw. Rect/Fib/Trend need 2 clicks. Long/Short = 1 click.</div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#71717a', background: '#1a1a1a', padding: 8, borderRadius: 8 }}>
            <div style={{ color: '#e5e5e5', marginBottom: 4, fontWeight: 600 }}>How chart works</div>
            Base 1m NQ 2022-2025 → resampled on fly to 1m/2m/3m/5m/10m/15m/30m/45m/1H/2H/4H/1D via bucket <code>floor(time/tf)*tf</code>. Replay = slice <code>bars[0..cursor]</code>. Volume = HistogramSeries.
          </div>
        </div>
      </div>
    </div>
  )
}
