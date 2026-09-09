import { useState, useRef, useEffect } from 'react'

export type TfOption = { label: string; seconds: number; section: string }

export const TF_SECTIONS: { title: string; options: TfOption[] }[] = [
  { title: 'SECONDS', options: [
    { label: '5s', seconds: 5, section: 'SECONDS' },
    { label: '15s', seconds: 15, section: 'SECONDS' },
    { label: '30s', seconds: 30, section: 'SECONDS' },
    { label: '45s', seconds: 45, section: 'SECONDS' },
  ]},
  { title: 'MINUTES', options: [
    { label: '1m', seconds: 60, section: 'MINUTES' },
    { label: '2m', seconds: 120, section: 'MINUTES' },
    { label: '3m', seconds: 180, section: 'MINUTES' },
    { label: '5m', seconds: 300, section: 'MINUTES' },
    { label: '10m', seconds: 600, section: 'MINUTES' },
    { label: '15m', seconds: 900, section: 'MINUTES' },
    { label: '30m', seconds: 1800, section: 'MINUTES' },
    { label: '45m', seconds: 2700, section: 'MINUTES' },
  ]},
  { title: 'HOURS', options: [
    { label: '1H', seconds: 3600, section: 'HOURS' },
    { label: '2H', seconds: 7200, section: 'HOURS' },
    { label: '4H', seconds: 14400, section: 'HOURS' },
  ]},
  { title: 'DAY · WEEK · MONTH', options: [
    { label: '1D', seconds: 86400, section: 'DAY' },
    { label: '1W', seconds: 604800, section: 'DAY' },
    { label: '1M', seconds: 2592000, section: 'DAY' },
  ]},
]

export const ALL_TFS = TF_SECTIONS.flatMap(s=>s.options)

export function parseQuickInput(input: string): number | null {
  const t = input.trim().toLowerCase()
  if (!t) return null
  // capture number + optional unit
  const m = t.match(/^(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hr|hrs|hours?|d|day|days?|w|week|weeks?|mo|month|months?)?$/)
  if (!m) return null
  const n = parseInt(m[1],10)
  let unit = (m[2]||'m').toLowerCase()
  if (unit.startsWith('sec')) unit='s'
  else if (unit.startsWith('min')) unit='m'
  else if (unit.startsWith('h')) unit='h'
  else if (unit.startsWith('d')) unit='d'
  else if (unit.startsWith('w')) unit='w'
  else if (unit.startsWith('mo')) unit='mo'
  else if (unit==='m') unit='m'
  else if (unit==='s') unit='s'
  const mult: Record<string, number> = { s:1, m:60, h:3600, d:86400, w:604800, mo:2592000 }
  return n * (mult[unit] ?? 60)
}

type Props = {
  seconds: number
  onSelect: (seconds: number) => void
  compact?: boolean
}

export default function TimeframePicker({ seconds, onSelect, compact }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return ()=>document.removeEventListener('mousedown', h)
  },[])

  const currentLabel = ALL_TFS.find(t=>t.seconds===seconds)?.label ?? (
    seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${seconds/60}m` : seconds < 86400 ? `${seconds/3600}H` : seconds < 604800 ? `${seconds/86400}D` : `${Math.round(seconds/604800)}W`
  )

  if (compact) {
    // bottom pills like image: 30s 1m 3m...
    return (
      <div style={{ display:'flex', gap:2, background:'#1a1a1a', padding:2, borderRadius:8 }}>
        {[
          { l:'30s', s:30 }, { l:'1m', s:60 }, { l:'3m', s:180 }, { l:'5m', s:300 }, { l:'15m', s:900 }, { l:'30m', s:1800 }, { l:'1H', s:3600 }, { l:'4H', s:14400 }, { l:'1D', s:86400 },
        ].map(o=> (
          <button key={o.s} onClick={()=>onSelect(o.s)} style={{ padding:'3px 6px', borderRadius:6, fontSize:11, fontFamily:'monospace', background: seconds===o.s ? '#2962ff' : 'transparent', color: seconds===o.s ? '#fff' : '#a1a1aa', border:'none' }}>{o.l}</button>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:6, fontSize:12, fontFamily:'monospace', fontWeight:600, background: open ? '#1f1f1f' : '#1a1a1a', color:'#e5e7eb', border:'1px solid #27272a', minWidth:44, justifyContent:'center' }}>
        {currentLabel} <span style={{ fontSize:9, opacity:0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, width:150, background:'#0f0f0f', border:'1px solid #27272a', borderRadius:12, boxShadow:'0 16px 48px rgba(0,0,0,0.7)', zIndex:200, padding:'6px 0', maxHeight:520, overflowY:'auto' }}>
          {TF_SECTIONS.map(sec=>(
            <div key={sec.title}>
              <div style={{ padding:'8px 10px 4px', fontSize:9, letterSpacing:'0.08em', color:'#71717a', fontWeight:700 }}>{sec.title}</div>
              {sec.options.map(opt=>{
                const active = seconds===opt.seconds
                return (
                  <button key={opt.label} onClick={()=>{ onSelect(opt.seconds); setOpen(false)}} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', background: active ? '#1e3a8a' : 'transparent', color: active ? '#fff' : '#e5e7eb', border:'none', fontSize:12, fontFamily:'monospace', cursor:'pointer' }}>
                    <span>{opt.label}</span>{active && <span style={{ color:'#60a5fa' }}>✓</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
