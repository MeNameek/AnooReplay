import { useState } from 'react'
import { TrendingUp, Square, BarChart3, Shapes, Type, Layers, Magnet, Ruler, Lock, Eye, Trash2, Plus } from 'lucide-react'
import { TOOL_GROUPS } from '../lib/tools'

type Props = {
  activeTool: string
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onSelectTool: (id: string) => void
  onTrash: () => void
}

const GROUP_ICONS: Record<string, any> = {
  lines: TrendingUp,
  channels: Layers,
  fib: BarChart3,
  patterns: TrendingUp,
  elliott: TrendingUp,
  forecast: TrendingUp,
  volume: BarChart3,
  measurers: Ruler,
  shapes: Shapes,
  text: Type,
  content: Layers,
}

export default function LeftToolbar({ activeTool, favorites, onToggleFavorite, onSelectTool, onTrash }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  return (
    <div style={{ width: 44, background: '#0a0a0b', borderRight: '1px solid #1a1a1e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: 2, position: 'relative', zIndex: 40 }}>
      <button title="Add" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #27272a', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Plus size={16} />
      </button>

      {TOOL_GROUPS.map(g => {
        const isActive = g.tools.some(t => t.id === activeTool)
        const Icon = GROUP_ICONS[g.id] || Shapes
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
              <Icon size={16} />
            </button>
            {openGroup === g.id && (
              <div style={{ position: 'absolute', left: 44, top: -6, background: '#0f0f0f', border: '1px solid #27272a', borderRadius: 12, minWidth: 282, maxHeight: 560, overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.7)', zIndex: 120, padding: '8px 0' }}>
                <div style={{ padding: '6px 14px 8px', fontSize: 10, letterSpacing: '0.08em', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>{g.label}</div>
                {g.tools.map(t => {
                  const fav = favorites.includes(t.id)
                  const active = activeTool === t.id
                  return (
                    <div key={t.id} onClick={() => { onSelectTool(t.id); setOpenGroup(null) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', background: active ? '#1f1f1f' : 'transparent', cursor: 'pointer', borderLeft: active ? '2px solid #2962ff' : '2px solid transparent' }}>
                      <Icon size={14} color={active ? '#fff' : '#a1a1aa'} />
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

      <button title="Magnet" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Magnet size={16} />
      </button>
      <button title="Measure" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ruler size={16} />
      </button>
      <button title="Lock" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Lock size={16} />
      </button>
      <button title="Visibility" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Eye size={16} />
      </button>
      <button title="Trash" onClick={onTrash} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={16} />
      </button>

      {openGroup && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpenGroup(null)} />}
    </div>
  )
}
