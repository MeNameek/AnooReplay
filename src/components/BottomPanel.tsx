import { useRef, useState } from 'react'

type Props = { open:boolean; height:number; setHeight:(h:number)=>void; setOpen:(v:boolean)=>void }

export default function BottomPanel({ open, height, setHeight, setOpen }: Props) {
  const dragRef = useRef<number|null>(null)
  const onDown=(e:React.MouseEvent)=>{
    dragRef.current = e.clientY
    const startH = height
    const mv=(ev:MouseEvent)=>{
      if(dragRef.current==null) return
      const dy = dragRef.current - ev.clientY
      const nh = Math.max(120, Math.min(420, startH + dy))
      setHeight(nh)
      if(nh>140) setOpen(true)
      if(nh<130) setOpen(false)
    }
    const up=()=>{ dragRef.current=null; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
  }
  return (
    <div style={{ background:'#0a0a0b', borderTop:'1px solid #1a1a1e', display:'flex', flexDirection:'column' }}>
      {/* drag handle */}
      <div onMouseDown={onDown} style={{ height:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'row-resize', background:'#0a0a0b' }}>
        <div style={{ width:36, height:3, borderRadius:2, background:'#27272a' }} />
      </div>
      {open && (
        <div style={{ height, display:'flex', flexDirection:'column', padding:'10px 12px', overflow:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>∼</div>
            <select defaultValue="may · $50k" style={{ background:'#1a1a1e', border:'1px solid #27272a', color:'#fff', borderRadius:6, padding:'4px 8px', fontSize:11 }}><option>may · $50k</option></select>
          </div>
          <div style={{ display:'flex', gap:12, fontSize:11 }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:1, color:'#71717a' }}>NET P&L</div>
              <div style={{ fontSize:18, color:'#10b981', fontWeight:700 }}>+$1,548.00</div>
              <div style={{ fontSize:10, color:'#71717a' }}>+774 pts · 4 trades</div>
            </div>
            <div style={{ flex:1, background:'#0f0f0f', border:'1px solid #1a1a1e', borderRadius:8, padding:8 }}>
              <div style={{ fontSize:9, letterSpacing:1, color:'#71717a' }}>EQUITY CURVE</div>
              <svg width="100%" height="60" viewBox="0 0 300 60"><path d="M0 50 L60 45 L120 38 L180 40 L240 22 L300 10" fill="none" stroke="#10b981" strokeWidth="1.5" /><path d="M0 50 L60 45 L120 38 L180 40 L240 22 L300 10 L300 60 L0 60 Z" fill="rgba(16,185,129,0.15)" /></svg>
            </div>
          </div>
          <table style={{ width:'100%', marginTop:10, borderCollapse:'collapse', fontSize:11 }}>
            <thead><tr style={{ color:'#71717a', fontSize:9 }}><th style={{ textAlign:'left', padding:'4px' }}>#</th><th>Side</th><th>Qty</th><th>Entry</th><th>@</th><th>Exit</th><th>@</th><th>Pts</th><th>P&L</th></tr></thead>
            <tbody style={{ color:'#e5e7eb' }}>
              <tr><td>1</td><td style={{ color:'#60a5fa' }}>Long</td><td>12</td><td>2026-05-01</td><td>27777</td><td>2026-05-01</td><td>27797</td><td style={{ color:'#10b981' }}>+20</td><td style={{ color:'#10b981' }}>$486</td></tr>
              <tr><td>2</td><td style={{ color:'#60a5fa' }}>Long</td><td>13</td><td>2026-05-05</td><td>28093</td><td>2026-05-05</td><td>28075</td><td style={{ color:'#ef4444' }}>-18</td><td style={{ color:'#ef4444' }}>-$468</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
