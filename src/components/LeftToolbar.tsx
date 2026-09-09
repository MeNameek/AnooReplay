import { useState } from 'react'
import { TOOL_GROUPS } from '../lib/tools'

type Props = {
  activeTool: string
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onSelectTool: (id: string) => void
  onTrash: () => void
}

const ICONS: Record<string, string> = {
  lines: 'M5 20 L19 4', // diagonal
  channels: 'M5 7 L19 11 M5 13 L19 17',
  fib: 'M5 6 H19 M5 11 H19 M5 16 H19 M9 6 V16',
  patterns: 'M4 14 L7 7 L11 14 L14 8 L18 14',
  elliott: 'M4 16 L8 6 L12 16 L16 4 L20 12 L16 16',
  forecast: 'M12 4 V16 M12 16 L8 12 M12 16 L16 12',
  volume: 'M6 5 H10 V15 H6 Z M13 8 H17 V15 H13 Z',
  measurers: 'M7 12 H17 M12 7 V17',
  shapes: 'M6 6 H18 V18 H6 Z',
  text: 'M7 4 H17 M12 4 V16 H10 V20 H14 V20',
  content: 'M6 6 H18 V18 H6 Z M8 8 H14 M8 11 H14',
}

export default function LeftToolbar({ activeTool, favorites, onToggleFavorite, onSelectTool, onTrash }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // Nami left bar is 44px, bg #0a0a0b, border #1a1a1e
  return (
    <div style={{ width: 44, background: '#0a0a0b', borderRight: '1px solid #1a1a1e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: 2, position: 'relative', zIndex: 40 }}>
      {/* Top + button */}
      <button title="Add" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #27272a', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5 V19 M5 12 H19" /></svg>
      </button>

      {/* Active tool highlight bar like Nami */}
      {TOOL_GROUPS.map(g => {
        const isActive = g.tools.some(t => t.id === activeTool)
        return (
          <div key={g.id} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            {isActive && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 22, background: '#2962ff', borderRadius: 2 }} />}
            <button
              title={g.label}
              onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: isActive ? '#1a1a1e' : 'transparent',
                color: isActive ? '#fff' : '#71717a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[g.id] ?? ICONS.shapes} /></svg>
            </button>
            {openGroup === g.id && (
              <div style={{ position: 'absolute', left: 44, top: -6, background: '#0f0f0f', border: '1px solid #27272a', borderRadius: 12, minWidth: 282, maxHeight: 560, overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.7)', zIndex: 120, padding: '8px 0' }}>
                <div style={{ padding: '6px 14px 8px', fontSize: 10, letterSpacing: '0.08em', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>{g.label}</div>
                {g.tools.map(t => {
                  const fav = favorites.includes(t.id)
                  const active = activeTool === t.id
                  return (
                    <div key={t.id} onClick={() => { onSelectTool(t.id); setOpenGroup(null) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', background: active ? '#1f1f1f' : 'transparent', cursor: 'pointer', borderLeft: active ? '2px solid #2962ff' : '2px solid transparent' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#a1a1aa'} strokeWidth="1.6"><path d={ICONS[g.id]} /></svg>
                      <span style={{ flex: 1, fontSize: 13, color: active ? '#fff' : '#e5e7eb', fontWeight: active ? 600 : 400 }}>{t.label}</span>
                      <button onClick={e => { e.stopPropagation(); onToggleFavorite(t.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: fav ? '#facc15' : '#3f3f46', fontSize: 14, lineHeight: 1, padding: '2px 4px' }}>{fav ? '★' : '☆'}</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ height: 8 }} />
      <div style={{ width: 22, height: 1, background: '#1a1a1e', margin: '4px 0' }} />

      {/* Bottom icons like Nami: magnet, brush, lock, eye, trash */}
      <button title="Magnet" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 9 H8 V15 H5 Z M16 9 H19 V15 H16 Z M8 12 H16" /></svg>
      </button>
      <button title="Measure" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a' }}>⟁</button>
      <button title="Lock" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', fontSize: 12 }}>🔒</button>
      <button title="Visibility" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', fontSize: 12 }}>👁</button>
      <button title="Trash" onClick={onTrash} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6 H21 M8 6 V4 H16 V6 M19 6 V20 H5 V6 M10 11 V17 M14 11 V17" /></svg>
      </button>

      {openGroup && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpenGroup(null)} />}
    </div>
  )
}
