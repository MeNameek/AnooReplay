import { useEffect, useState, useCallback, useRef } from 'react'
import Chart from './components/Chart'
import LeftToolbar from './components/LeftToolbar'
import FavoriteWidget from './components/FavoriteWidget'
import SettingsModal from './components/SettingsModal'
import { resample, TIMEFRAMES, type Bar } from './lib/resample'
import type { Drawing } from './lib/types'
import { defaultFavorites } from './lib/tools'
import { DEFAULT_SETTINGS, type ChartSettings } from './lib/settings'
import TimeframePicker from './components/TimeframePicker'
import QuickSwitch from './components/QuickSwitch'

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10]

export default function App() {
  const [timeframe, setTimeframe] = useState(60)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [rawBars, setRawBars] = useState<Bar[]>([])
  const [bars, setBars] = useState<Bar[]>([])
  const [cursor, setCursor] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [replayMode, setReplayMode] = useState(true)
  const [activeTool, setActiveTool] = useState<string>('cursor')
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { const v = localStorage.getItem('ano:favs'); return v ? JSON.parse(v) : defaultFavorites() } catch { return defaultFavorites() }
  })
  const [settings, setSettings] = useState<ChartSettings>(() => {
    try { const v = localStorage.getItem('ano:settings'); return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : DEFAULT_SETTINGS } catch { return DEFAULT_SETTINGS }
  })
  const [showSettings, setShowSettings] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => { localStorage.setItem('ano:favs', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('ano:settings', JSON.stringify(settings)) }, [settings])

  useEffect(() => {
    fetch('/data/NQ/dates.json').then(r => r.json()).then((dates: string[]) => {
      setAvailableDates(dates)
      if (dates.length && !selectedDate) {
        const mid = dates[Math.floor(dates.length * 0.6)]
        setSelectedDate(mid)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedDate || availableDates.length === 0) return
    const idx = availableDates.indexOf(selectedDate)
    if (idx === -1) return
    const start = Math.max(0, idx - 30)
    const slice = availableDates.slice(start, idx + 1)
    Promise.all(slice.map(d => fetch(`/data/NQ/${d}.json`).then(r => r.ok ? r.json() : []).catch(() => []))).then(results => {
      const all: Bar[] = []
      for (const arr of results) for (const t of arr as any[]) if (Array.isArray(t)) all.push({ time: t[0], open: t[1], high: t[2], low: t[3], close: t[4], volume: t[5] }); else all.push(t)
      all.sort((a,b)=>a.time-b.time)
      setRawBars(all)
      const selStart = new Date(selectedDate+'T00:00:00Z').getTime()/1000
      let sc = all.findIndex(b=>b.time>=selStart)
      if (sc===-1) sc=Math.max(0, all.length-300)
      ;(window as any).__startCursorTime = all[sc]?.time
    })
  }, [selectedDate, availableDates])

  useEffect(() => {
    const res = resample(rawBars, timeframe)
    setBars(res)
    const t: number|undefined = (window as any).__startCursorTime
    if (t) { let idx=res.findIndex(b=>b.time>=t); if(idx===-1) idx=res.length-1; setCursor(idx) } else setCursor(res.length-1)
  }, [rawBars, timeframe])

  useEffect(() => {
    if (isPlaying) timerRef.current = window.setInterval(()=> setCursor(c=>{ if(c>=bars.length-1){setIsPlaying(false); return c} return c+1 }), 600/speed) as any
    else if(timerRef.current) clearInterval(timerRef.current as any)
    return ()=>{ if(timerRef.current) clearInterval(timerRef.current as any) }
  }, [isPlaying, speed, bars.length])

  const step=(dir:number)=>{ setIsPlaying(false); setCursor(c=>Math.min(bars.length-1, Math.max(0,c+dir))) }
  const goToDate=(d:string)=>{ setIsPlaying(false); setSelectedDate(d) }
  const jumpDays=(n:number)=>{ const i=availableDates.indexOf(selectedDate); const ni=Math.min(availableDates.length-1, Math.max(0,i+n)); goToDate(availableDates[ni]) }
  const addDrawing=useCallback((d:Drawing)=>setDrawings(p=>[...p,d]),[])
  const toggleFav=(id:string)=> setFavorites(f=> f.includes(id)? f.filter(x=>x!==id): [...f,id])

  // map Nami tool ids to Chart ids
  const mapTool=(id:string)=>{
    if(['trendline','ray','extended','trendAngle','infoLine'].includes(id)) return 'trend'
    if(['hline','hRay'].includes(id)) return 'hline'
    if(id==='vline') return 'vline'
    if(['parallelChannel','regressionTrend','flatTopBottom'].includes(id)) return 'trend'
    if(['fib','fibExtension','fibChannel','fibTimeZone','fibSpeedFan','fibTrendTime','fibCircles','fibSpiral','fibArcs','fibWedge','pitchfan'].includes(id)) return 'fib'
    if(['rect','rotatedRect','path','circle','ellipse','polyline','triangle','arc','curve','doubleCurve'].includes(id)) return 'rect'
    if(['long','short'].includes(id)) return id
    if(['priceRange','dateRange','datePriceRange'].includes(id)) return 'rect'
    if(['text','note','priceNote','pin','table','callout','comment','priceLabel','signpost','flag','image','post','idea'].includes(id)) return 'hline'
    if(['anchoredVwap','fixedRangeVP','anchoredVP','positionForecast','barsPattern','ghostFeed','sector'].includes(id)) return 'hline'
    if(['xabcd','cypher','headShoulders','abcd','trianglePattern','threeDrives','elliottImpulse','elliottCorrection','elliottTriangle','elliottDouble','elliottTriple'].includes(id)) return 'trend'
    return id
  }

  const currentBar = bars[cursor]
  const tfLabel = TIMEFRAMES.find(t=>t.s===timeframe)?.label ?? `${timeframe/60}m`

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background: '#0a0a0b' }}>
      <QuickSwitch onSwitch={setTimeframe} />
      <div style={{ height:36, display:'flex', alignItems:'center', gap:6, padding:'0 8px', borderBottom:'1px solid #1a1a1e', background:'#0a0a0b', overflowX:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700 }}>
          <span style={{ background:'#1a1a1e', padding:'2px 6px', borderRadius:6, fontFamily:'monospace', color:'#fff', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>∼ MNQ1! <span style={{ background:'#27272a', padding:'0 4px', borderRadius:4, fontSize:9 }}>/</span></span>
          <span style={{ color:'#71717a', fontSize:11, background:'#1a1a1e', padding:'2px 6px', borderRadius:6 }}>● EVAL · Exit</span>
          <button style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', width:22, height:22, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        </div>
        <div style={{ width:1, height:16, background:'#1a1a1e' }} />
        <TimeframePicker seconds={timeframe} onSelect={setTimeframe} />
        <div style={{ display:'flex', alignItems:'center', gap:2, background:'#1a1a1e', padding:'2px 4px', borderRadius:6 }}>
          <span style={{ fontSize:10, color:'#71717a' }}>◍</span><span style={{ fontSize:11, color:'#a1a1aa' }}>Indicators</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:4 }}>
          <span style={{ fontSize:11, color:'#a1a1aa', background:'#1a1a1e', padding:'3px 6px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>📅 ≫ To latest</span>
          <span style={{ fontSize:11, color:'#a1a1aa', background:'#1a1a1e', padding:'3px 6px', borderRadius:6 }}>↷ Go to</span>
          <span style={{ display:'flex', gap:2 }}><button onClick={()=>jumpDays(-1)} style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'3px 6px', borderRadius:6 }}>←</button><button onClick={()=>jumpDays(1)} style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'3px 6px', borderRadius:6 }}>→</button></span>
        </div>
        <input type="date" value={selectedDate} onChange={e=>goToDate(e.target.value)} min={availableDates[0]} max={availableDates[availableDates.length-1]} style={{ marginLeft:6, background:'#1a1a1e', border:'1px solid #27272a', color:'#e5e5e5', borderRadius:6, padding:'3px 6px', fontSize:11, height:22 }} />
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button onClick={()=>setShowSettings(true)} title="Settings" style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'4px 8px', borderRadius:6 }}>⚙</button>
          {currentBar && <div style={{ fontFamily:'monospace', fontSize:11, color:'#fff', background:'#1a1a1e', padding:'3px 6px', borderRadius:6 }}>{currentBar.close.toFixed(2)} <span style={{ color: currentBar.close>=currentBar.open?'#26a69a':'#ef5350' }}>{currentBar.close>=currentBar.open?'+0.11%':'-0.11%'}</span></div>}
          <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#a1a1aa', background:'#1a1a1e', padding:'3px 6px', borderRadius:6 }}><input type="checkbox" checked={replayMode} onChange={e=>setReplayMode(e.target.checked)} /> Replay</label>
          <button style={{ background:'#fff', color:'#000', padding:'4px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:700 }}>Journal</button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <LeftToolbar activeTool={activeTool} favorites={favorites} onToggleFavorite={toggleFav} onSelectTool={id=>setActiveTool(id)} onTrash={()=>setDrawings([])} />

        <div style={{ flex:1, position:'relative', display:'flex', flexDirection:'column' }}>
          {bars.length===0? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#71717a', fontFamily:'monospace', fontSize:12 }}>Loading {selectedDate}...</div> :
          <div style={{ flex:1, position:'relative' }}>
            <Chart bars={bars} cursor={cursor} replayMode={replayMode} timeframe={timeframe} dateKey={selectedDate} drawings={drawings} activeTool={mapTool(activeTool)} onAddDrawing={addDrawing} settings={settings} />
            {settings.watermark && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:120, fontWeight:800, color:'rgba(255,255,255,0.04)', pointerEvents:'none', letterSpacing:-8 }}>{tfLabel}</div>}
            {settings.detachableToolbars && <FavoriteWidget favorites={favorites} activeTool={activeTool} onSelect={id=>setActiveTool(id)} onRemove={toggleFav} />}
          </div>}

          <div style={{ height:36, display:'flex', alignItems:'center', gap:6, padding:'0 8px', borderTop:'1px solid #1a1a1e', background:'#0a0a0b', fontSize:11, position:'relative' }}>
            {/* bottom pills like Image 1: 30s 1m 3m... */}
            <div style={{ display:'flex', gap:2, background:'#1a1a1e', padding:2, borderRadius:8 }}>
              {[
                { l:'30s', s:30 }, { l:'1m', s:60 }, { l:'3m', s:180 }, { l:'5m', s:300 }, { l:'15m', s:900 }, { l:'30m', s:1800 }, { l:'1H', s:3600 }, { l:'4H', s:14400 }, { l:'1D', s:86400 },
              ].map(o=> <button key={o.s} onClick={()=>setTimeframe(o.s)} style={{ padding:'4px 6px', borderRadius:6, fontSize:11, fontFamily:'monospace', background: timeframe===o.s ? '#fff' : 'transparent', color: timeframe===o.s ? '#000' : '#a1a1aa', border:'none', fontWeight: timeframe===o.s?700:400 }}>{o.l}</button>)}
              <button style={{ padding:'3px 6px', borderRadius:6, background:'transparent', border:'none', color:'#71717a' }}>▦</button>
            </div>
            <button style={{ marginLeft:6, background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'4px 6px', borderRadius:6, fontSize:11 }}>📅</button>
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <button onClick={()=>step(-1)} style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'4px 8px', borderRadius:6 }}>◀</button>
              <button onClick={()=>setIsPlaying(v=>!v)} style={{ background:isPlaying?'#fff':'#1a1a1e', border:'none', color:isPlaying?'#000':'#a1a1aa', padding:'4px 10px', borderRadius:6 }}>{isPlaying?'⏸':'▶'}</button>
              <button onClick={()=>step(1)} style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'4px 8px', borderRadius:6 }}>▶</button>
              <span style={{ color:'#71717a', margin:'0 6px' }}>≫</span>
              <div style={{ display:'flex', gap:2, alignItems:'center' }}>{SPEED_OPTIONS.slice(0,4).map(s=> <button key={s} onClick={()=>setSpeed(s)} style={{ padding:'2px 6px', borderRadius:6, border:'none', background: speed===s?'#fff':'#1a1a1e', color: speed===s?'#000':'#a1a1aa', fontFamily:'monospace', fontSize:11 }}>{s}x</button>)}<span style={{ background:'#1a1a1e', color:'#a1a1aa', padding:'2px 6px', borderRadius:6, fontFamily:'monospace' }}>{speed}x ▾</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:2, marginLeft:8, background:'#1a1a1e', padding:'2px 6px', borderRadius:6 }}>
                <span style={{ color:'#fff', fontSize:11 }}>{tfLabel} ▾</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button style={{ background:'#1a1a1e', border:'none', color:'#a1a1aa', padding:'4px 8px', borderRadius:6, fontSize:11 }}>♡ Bookmarks</button>
              <span style={{ fontFamily:'monospace', color:'#a1a1aa', background:'#1a1a1e', padding:'3px 6px', borderRadius:6, fontSize:11 }}>{currentBar? new Date(currentBar.time*1000).toLocaleString('en-US',{ month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'America/New_York'})+' ET':''} — 09:42</span>
            </div>
          </div>
        </div>

        <div style={{ width:220, background:'#0a0a0a', borderLeft:'1px solid #1a1a1a', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.6, color:'#e5e5e5' }}>NQ · {tfLabel}</div>
          <div style={{ fontSize:11, color:'#71717a', fontFamily:'monospace' }}>{availableDates.length} days loaded</div>
          <div style={{ height:1, background:'#1a1a1a' }} />
          <div style={{ fontSize:11, color:'#a1a1aa' }}>Drawings: {drawings.length}</div>
          <div style={{ fontSize:10, color:'#71717a' }}>★ to favorite → draggable widget. Click ★ again to remove.</div>
          <button onClick={()=>setShowSettings(true)} style={{ marginTop:6, background:'#1a1a1a', border:'1px solid #27272a', color:'#e5e5e5', padding:'8px 10px', borderRadius:8, fontSize:11 }}>⚙ Chart Settings</button>
        </div>
      </div>

      <SettingsModal open={showSettings} onClose={()=>setShowSettings(false)} settings={settings} onChange={setSettings} />
    </div>
  )
}
