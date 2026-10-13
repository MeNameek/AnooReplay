import { useState, useRef, useEffect } from 'react'
import { Clock, Globe, ChevronDown } from 'lucide-react'

type Props = {
  rawBars: { time: number }[]
  cursor: number
  setCursor: (n: number) => void
}

const SESSIONS = [
  { id: 'ny_open', label: 'New York Open', time: '09:30', offset: 0, icon: '🗽' },
  { id: 'ny_close', label: 'New York Close', time: '16:00', offset: 0, icon: '🗽' },
  { id: 'london_open', label: 'London Open', time: '03:00', offset: 0, icon: '🇬🇧' },
  { id: 'london_close', label: 'London Close', time: '11:00', offset: 0, icon: '🇬🇧' },
  { id: 'asia_open', label: 'Asia Open', time: '18:00', offset: -1, icon: '🌏' },
  { id: 'asia_close', label: 'Asia Close', time: '02:00', offset: 0, icon: '🌏' },
]

export default function GoToDropdown({ rawBars, cursor, setCursor }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const goToSession = (session: typeof SESSIONS[0]) => {
    if (rawBars.length === 0) return
    const currentBar = rawBars[cursor] || rawBars[rawBars.length - 1]
    const currentDate = new Date(currentBar.time * 1000)
    const [hh, mm] = session.time.split(':').map(Number)
    
    const targetDate = new Date(currentDate)
    targetDate.setUTCHours(hh, mm, 0, 0)
    targetDate.setUTCDate(targetDate.getUTCDate() + session.offset)
    
    const targetTime = Math.floor(targetDate.getTime() / 1000)
    
    let idx = rawBars.findIndex(b => b.time >= targetTime)
    if (idx === -1) idx = rawBars.length - 1
    
    setCursor(idx)
    setOpen(false)
  }

  const goToNextSession = (session: typeof SESSIONS[0]) => {
    if (rawBars.length === 0) return
    const currentBar = rawBars[cursor] || rawBars[rawBars.length - 1]
    const currentDate = new Date(currentBar.time * 1000)
    const [hh, mm] = session.time.split(':').map(Number)
    
    let targetDate = new Date(currentDate)
    targetDate.setUTCHours(hh, mm, 0, 0)
    
    if (targetDate.getTime() <= currentDate.getTime()) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1)
    }
    
    const targetTime = Math.floor(targetDate.getTime() / 1000)
    let idx = rawBars.findIndex(b => b.time >= targetTime)
    if (idx === -1) idx = rawBars.length - 1
    
    setCursor(idx)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(v => !v)} style={{ fontSize:11, color:'#e5e7eb', background:'rgba(26, 26, 30, 0.8)', padding:'6px 12px', borderRadius:8, border:'1px solid rgba(63, 63, 70, 0.5)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:600, backdropFilter:'blur(10px)', transition:'all 0.15s' }}>
        <Globe size={14} />
        Go to
        <ChevronDown size={12} style={{ opacity: open ? 1 : 0.5, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      
      {open && (
        <div style={{ position:'fixed', top:44, left: ref.current?.getBoundingClientRect().left || 0, background:'rgba(15, 15, 17, 0.95)', border:'1px solid rgba(63, 63, 70, 0.5)', borderRadius:12, minWidth:220, boxShadow:'0 16px 48px rgba(0,0,0,0.8)', zIndex:9999, overflow:'hidden', backdropFilter:'blur(20px)' }}>
          <div style={{ padding:'8px 12px', borderBottom:'1px solid #1a1a1e', fontSize:10, letterSpacing:'0.08em', color:'#71717a', fontWeight:700, textTransform:'uppercase' }}>
            Sessions
          </div>
          {SESSIONS.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background 0.15s', background: 'transparent' }} onClick={() => goToSession(s)} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(39, 39, 42, 0.6)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ flex:1, fontSize:12, color:'#e5e7eb', fontWeight:500 }}>{s.label}</span>
              <span style={{ fontSize:11, color:'#71717a', fontFamily:'monospace', fontWeight:500 }}>{s.time} ET</span>
            </div>
          ))}
          <div style={{ height:1, background:'rgba(39, 39, 42, 0.5)', margin:'4px 0' }} />
          <div style={{ padding:'10px 16px', cursor:'pointer', fontSize:12, color:'#60a5fa', fontWeight:600, borderTop: '1px solid rgba(39, 39, 42, 0.5)' }} onClick={() => { setCursor(rawBars.length - 1); setOpen(false) }}>
            To Latest
          </div>
        </div>
      )}
    </div>
  )
}
