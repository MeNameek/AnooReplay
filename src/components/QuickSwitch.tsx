import { useEffect, useState } from 'react'
import { parseQuickInput } from './TimeframePicker'

type Props = { onSwitch: (seconds: number) => void }

export default function QuickSwitch({ onSwitch }: Props) {
  const [active, setActive] = useState(false)
  const [buf, setBuf] = useState('')

  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      // ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName
      if (tag==='INPUT' || tag==='TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // if not active, only digits start it (like Nami: pressing 1 shows box)
      if (!active) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault()
          setActive(true)
          setBuf(e.key)
        }
        return
      }

      // active: handle input
      if (e.key==='Enter') {
        e.preventDefault()
        const sec = parseQuickInput(buf)
        if (sec) onSwitch(sec)
        setActive(false)
        setBuf('')
      } else if (e.key==='Escape') {
        setActive(false)
        setBuf('')
      } else if (e.key==='Backspace') {
        e.preventDefault()
        setBuf(b=>b.slice(0,-1))
        if (buf.length<=1) { /* keep open but empty shows big 1? we'll close if empty */ }
      } else if (/^[0-9a-zA-Z]$/.test(e.key) && buf.length < 6) {
        e.preventDefault()
        setBuf(b=>b+e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[active, buf, onSwitch])

  // auto-close if buf empty and user clicks away? keep until Esc/Enter
  useEffect(()=>{
    if (active && buf==='') {
      // show placeholder 1 like image 2 when just pressed 1
    }
  },[active, buf])

  if (!active) return null
  // if buffer empty, treat as "1" placeholder like screenshot shows big 1 with MIN TIMEFRAME hint
  const display = buf || '1'
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
      <div style={{ width:220, background:'rgba(20,20,20,0.92)', border:'1px solid #27272a', borderRadius:16, padding:'24px 0 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, boxShadow:'0 16px 48px rgba(0,0,0,0.6)', backdropFilter:'blur(8px)' }}>
        <div style={{ fontSize:48, fontWeight:800, color:'#fff', lineHeight:1 }}>{display}</div>
        <div style={{ fontSize:10, letterSpacing:'0.12em', color:'#a1a1aa', fontWeight:600 }}>MIN TIMEFRAME · S/M/H/D · ↵</div>
      </div>
    </div>
  )
}
