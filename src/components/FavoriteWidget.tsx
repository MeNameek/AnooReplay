import { useState, useRef } from 'react'
import { ALL_TOOLS } from '../lib/tools'

type Props = {
  favorites: string[]
  activeTool: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

export default function FavoriteWidget({ favorites, activeTool, onSelect, onRemove }: Props) {
  const [pos, setPos] = useState({ x: 220, y: 80 })
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  if (favorites.length === 0) return null

  const tools = favorites.map(id => ALL_TOOLS.find(t => t.id === id)).filter(Boolean) as any[]

  const onDown = (e: React.MouseEvent) => {
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    dragRef.current = { dx: startX, dy: startY }
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      setPos({ x: ev.clientX - dragRef.current.dx, y: ev.clientY - dragRef.current.dy })
    }
    const up = () => { dragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div style={{ position: 'absolute', left: pos.x, top: pos.y, display: 'flex', alignItems: 'center', gap: 4, background: '#0a0a0a', border: '1px solid #27272a', borderRadius: 10, padding: '6px 8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 30, cursor: 'grab' }} onMouseDown={onDown}>
      <span style={{ color: '#3f3f46', fontSize: 10, cursor: 'grab', paddingRight: 4 }}>⋮⋮</span>
      {tools.map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => onSelect(t.id)}
          onContextMenu={e => { e.preventDefault(); onRemove(t.id) }}
          style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: activeTool === t.id ? '#1a1a1a' : 'transparent', color: activeTool === t.id ? '#2962ff' : '#a1a1aa', fontSize: 11 }}
        >
          {t.label.slice(0, 2)}
        </button>
      ))}
      <span style={{ color: '#3f3f46', fontSize: 10 }}>⋮</span>
    </div>
  )
}
