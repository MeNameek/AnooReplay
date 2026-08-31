import { useState } from 'react'
import { TOOL_GROUPS } from '../lib/tools'

type Props = {
  activeTool: string
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onSelectTool: (id: string) => void
  onTrash: () => void
  onToggleVisibility?: () => void
  onLock?: () => void
}

export default function LeftToolbar({ activeTool, favorites, onToggleFavorite, onSelectTool, onTrash }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  return (
    <div style={{ width: 38, background: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', gap: 1, position: 'relative', zIndex: 40 }}>
      {/* Top crosshair */}
      <button title="Cursor" onClick={() => onSelectTool('cursor')} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: activeTool === 'cursor' ? '#1a1a1a' : 'transparent', color: activeTool === 'cursor' ? '#fff' : '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2 V22 M2 12 H22"/><circle cx="12" cy="12" r="2"/></svg>
      </button>

      {TOOL_GROUPS.map(g => (
        <div key={g.id} style={{ position: 'relative' }}>
          <button
            title={g.label}
            onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)}
            style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: g.tools.some(t => t.id === activeTool) ? '#2962ff22' : 'transparent', color: g.tools.some(t => t.id === activeTool) ? '#2962ff' : '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}
          >
            {/* generic icon placeholder */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={g.icon} /></svg>
          </button>
          {openGroup === g.id && (
            <div style={{ position: 'absolute', left: 38, top: -4, background: '#141414', border: '1px solid #27272a', borderRadius: 10, minWidth: 260, maxHeight: 520, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 100, padding: '6px 0' }}>
              <div style={{ padding: '4px 12px 6px', fontSize: 10, letterSpacing: 1, color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>{g.label}</div>
              {g.tools.map(t => {
                const fav = favorites.includes(t.id)
                const active = activeTool === t.id
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: active ? '#1f1f1f' : 'transparent', cursor: 'pointer' }} onClick={() => { onSelectTool(t.id); setOpenGroup(null) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? '#2962ff' : '#a1a1aa'} strokeWidth="1.6"><path d={TOOL_GROUPS.find(x=>x.tools.some(y=>y.id===t.id))?.icon ?? 'M4 12 H20'} /></svg>
                    <span style={{ flex: 1, fontSize: 12, color: active ? '#fff' : '#e5e5e5' }}>{t.label}</span>
                    <button onClick={e => { e.stopPropagation(); onToggleFavorite(t.id) }} style={{ background: 'none', border: 'none', color: fav ? '#facc15' : '#3f3f46', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>{fav ? '★' : '☆'}</button>
                  </div>
                )
              })}
              {/* For patterns we have two sub-sections, show divider but keep single group for now */}
            </div>
          )}
        </div>
      ))}

      <div style={{ flex: 1 }} />
      <button title="Lock" style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', color: '#71717a' }}>🔒</button>
      <button title="Hide" style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', color: '#71717a' }}>👁</button>
      <button title="Trash" onClick={onTrash} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', color: '#71717a', fontSize: 14 }}>🗑</button>
      {openGroup && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpenGroup(null)} />}
    </div>
  )
}
