import { useState, useRef } from 'react'
import { ALL_TOOLS, TOOL_GROUPS } from '../lib/tools'

type Props = { favorites: string[]; activeTool: string; onSelect: (id: string) => void; onRemove: (id: string) => void }

const ICONS: Record<string, string> = {
  lines: 'M5 20 L19 4', channels: 'M5 7 L19 11 M5 13 L19 17', fib: 'M5 6 H19 M5 11 H19', patterns:'M4 14 L7 7 L11 14', forecast:'M12 4 V16', volume:'M6 5 H10 V15', measurers:'M7 12 H17', shapes:'M6 6 H18 V18 H6 Z', text:'M7 4 H17', content:'M6 6 H18 V18',
}

export default function FavoriteWidget({ favorites, activeTool, onSelect, onRemove }: Props) {
  const [pos, setPos] = useState({ x: 180, y: 64 })
  const drag = useRef<{dx:number,dy:number}|null>(null)
  if (favorites.length===0) return null
  const tools = favorites.map(id=> ALL_TOOLS.find(t=>t.id===id)).filter(Boolean) as any[]
  const onDown=(e:React.MouseEvent)=>{ const sx=e.clientX-pos.x, sy=e.clientY-pos.y; drag.current={dx:sx,dy:sy}; const mv=(ev:MouseEvent)=>{ if(!drag.current) return; setPos({x:ev.clientX-drag.current.dx, y:ev.clientY-drag.current.dy})}; const up=()=>{drag.current=null; window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up)}; window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up) }
  return (
    <div style={{ position:'absolute', left:pos.x, top:pos.y, display:'flex', alignItems:'center', gap:2, background:'#0a0a0b', border:'1px solid #27272a', borderRadius:10, padding:'4px 6px', boxShadow:'0 10px 36px rgba(0,0,0,0.65)', zIndex:30 }} onMouseDown={onDown}>
      <span style={{ color:'#3f3f46', fontSize:10, padding:'0 4px', cursor:'grab' }}>⋮⋮</span>
      {tools.map(t=>{
        const g = TOOL_GROUPS.find(x=>x.tools.some(y=>y.id===t.id))
        const isActive = activeTool===t.id
        return (
          <button key={t.id} title={t.label} onClick={()=>onSelect(t.id)} onContextMenu={e=>{e.preventDefault(); onRemove(t.id)}} style={{ width:28, height:28, borderRadius:7, border:'none', background:isActive?'#1f1f1f':'transparent', color:isActive?'#fff':'#a1a1aa', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={ICONS[g?.id ?? 'shapes']} /></svg>
          </button>
        )
      })}
      <span style={{ color:'#27272a', fontSize:12, padding:'0 2px' }}>|</span>
      <button title="Trash" style={{ width:22, height:22, borderRadius:6, border:'none', background:'transparent', color:'#71717a', fontSize:11 }}>✕</button>
    </div>
  )
}
