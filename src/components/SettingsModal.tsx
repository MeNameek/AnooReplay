import { useState } from 'react'
import type { ChartSettings } from '../lib/settings'

type Props = { open: boolean; onClose: () => void; settings: ChartSettings; onChange: (s: ChartSettings) => void }

const TABS = ['Symbol','Appearance','Scales','Replay'] as const

export default function SettingsModal({ open, onClose, settings, onChange }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]>('Symbol')
  if (!open) return null
  const s = settings
  const upd = (k: keyof ChartSettings, v: any) => onChange({ ...s, [k]: v })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width: 780, maxHeight: '86vh', background: '#121212', border: '1px solid #27272a', borderRadius: 16, display: 'flex', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ width: 160, borderRight: '1px solid #1f1f1f', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, padding: '10px 8px 2px' }}>Settings</div>
          <div style={{ fontSize: 11, color: '#71717a', padding: '0 8px 12px' }}>Chart appearance & behaviour</div>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: tab===t ? '#1f1f1f' : 'transparent', color: tab===t ? '#fff' : '#a1a1aa', fontSize: 13, fontWeight: tab===t?700:400 }}>
              {t}<div style={{ fontSize: 10, color: '#71717a' }}>{t==='Symbol'?'Candles & volume': t==='Appearance'?'Colours & grid': t==='Scales'?'Axes & layout':'Playback'}</div>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{ fontSize: 11, background: '#1a1a1a', border: '1px solid #27272a', color: '#a1a1aa', padding: '6px 10px', borderRadius: 8 }}>⎇ Templates ▾</button>
        </div>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#0f0f0f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, letterSpacing: 1, color: '#71717a', fontWeight: 700 }}>{tab.toUpperCase()}</div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#1f1f1f', color: '#a1a1aa' }}>✕</button>
          </div>

          {tab==='Symbol' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section title="BODY">
                <Row label="Up color" color={s.upColor} onChange={v=>upd('upColor',v)} />
                <Row label="Down color" color={s.downColor} onChange={v=>upd('downColor',v)} />
              </Section>
              <Section title="BORDER">
                <Row label="Up border" color={s.upBorder} onChange={v=>upd('upBorder',v)} />
                <Row label="Down border" color={s.downBorder} onChange={v=>upd('downBorder',v)} />
              </Section>
              <Section title="WICK">
                <Row label="Up wick" color={s.upWick} onChange={v=>upd('upWick',v)} />
                <Row label="Down wick" color={s.downWick} onChange={v=>upd('downWick',v)} />
              </Section>
              <Section title="VOLUME">
                <Toggle label="Show volume" value={s.showVolume} onChange={v=>upd('showVolume',v)} />
                <Row label="Up volume" color={s.upVolume} onChange={v=>upd('upVolume',v)} />
                <Row label="Down volume" color={s.downVolume} onChange={v=>upd('downVolume',v)} />
              </Section>
            </div>
          )}

          {tab==='Appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section title="BACKGROUND"><Row label="Background" color={s.background} onChange={v=>upd('background',v)} /></Section>
              <Section title="GRID & SESSIONS">
                <Toggle label="Show grid" value={s.showGrid} onChange={v=>upd('showGrid',v)} />
                <Row label="Grid color" color={s.gridColor} onChange={v=>upd('gridColor',v)} />
                <Toggle label="Session breaks (18:00)" value={s.sessionBreaks} onChange={v=>upd('sessionBreaks',v)} />
                <Toggle label="Session zones (Asia / London / NY)" value={s.sessionZones} onChange={v=>upd('sessionZones',v)} />
                <Toggle label="Execution marks (entry / exit)" value={s.executionMarks} onChange={v=>upd('executionMarks',v)} />
                <Toggle label="Timeframe watermark" value={s.watermark} onChange={v=>upd('watermark',v)} />
              </Section>
              <Section title="CROSSHAIR">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Crosshair style</span><select value={s.crosshairStyle} onChange={e=>upd('crosshairStyle', e.target.value)} style={{ background:'#1f1f1f', border:'1px solid #27272a', color:'#fff', borderRadius:6, padding:'2px 6px' }}><option>dotted</option><option>solid</option><option>dashed</option></select></div>
                <Row label="Crosshair color" color={s.crosshairColor} onChange={v=>upd('crosshairColor',v)} />
                <Toggle label="Crosshair cursor" value={s.crosshairCursor} onChange={v=>upd('crosshairCursor',v)} />
                <Toggle label="Lock crosshair to tick grid" value={s.lockCrosshair} onChange={v=>upd('lockCrosshair',v)} />
              </Section>
              <Section title="TEXT">
                <Row label="Axis text color" color={s.axisTextColor} onChange={v=>upd('axisTextColor',v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Font size</span><span style={{ color:'#fff' }}>{s.fontSize} ▾</span></div>
              </Section>
            </div>
          )}

          {tab==='Scales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section title="PRICE SCALE">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Position</span><span>Right ▾</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Scale mode</span><span>Normal ▾</span></div>
                <Toggle label="Auto scale" value={s.autoScale} onChange={v=>upd('autoScale',v)} />
              </Section>
              <Section title="TIME SCALE">
                <Toggle label="Show time" value={s.showTime} onChange={v=>upd('showTime',v)} />
                <Toggle label="Show seconds" value={s.showSeconds} onChange={v=>upd('showSeconds',v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Timezone</span><span>{s.timezone} ▾</span></div>
              </Section>
              <Section title="STATUS LINE">
                <Toggle label="Show OHLC values" value={s.showOHLC} onChange={v=>upd('showOHLC',v)} />
                <Toggle label="Show bar change" value={s.showBarChange} onChange={v=>upd('showBarChange',v)} />
              </Section>
              <Section title="LAYOUT">
                <Toggle label="Detachable toolbars (replay + favourites)" value={s.detachableToolbars} onChange={v=>upd('detachableToolbars',v)} />
                <Toggle label="Sync compared charts (pan · zoom · price)" value={s.syncCompared} onChange={v=>upd('syncCompared',v)} />
              </Section>
              <Section title="INTERACTION">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Chart inertia</span><span>SNAPPY ———●——— FLOATY</span></div>
                <Toggle label="Performance mode" value={s.performanceMode} onChange={v=>upd('performanceMode',v)} />
              </Section>
            </div>
          )}

          {tab==='Replay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section title="REPLAY">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#a1a1aa' }}><span>Start time</span><span>{s.startTime} ▾</span></div>
                <Toggle label="Scroll with newest candle during play" value={s.scrollWithNewest} onChange={v=>upd('scrollWithNewest',v)} />
              </Section>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18, borderTop: '1px solid #1f1f1f', paddingTop: 12 }}>
            <button onClick={()=>onChange({...s})} style={{ background: '#1a1a1a', border: '1px solid #27272a', color: '#a1a1aa', padding: '8px 14px', borderRadius: 8, fontSize: 12 }}>Reset</button>
            <button onClick={onClose} style={{ background: '#fff', color: '#000', padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12 }}>Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: any) {
  return <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: 10, padding: '8px 10px' }}>
    <div style={{ fontSize: 10, letterSpacing: 1, color: '#71717a', fontWeight: 700, marginBottom: 6 }}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{children}</div>
  </div>
}
function Row({ label, color, onChange }: any) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid #242424', fontSize: 12 }}>
    <span style={{ color: '#a1a1aa' }}>{label}</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{color}<input type="color" value={color} onChange={e=>onChange(e.target.value)} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #27272a', padding: 0, background: 'transparent' }} /></span>
  </div>
}
function Toggle({ label, value, onChange }: any) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid #242424', fontSize: 12 }}>
    <span style={{ color: '#a1a1aa' }}>{label}</span>
    <button onClick={()=>onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: value ? '#2962ff' : '#3f3f46', position: 'relative', cursor: 'pointer' }}>
      <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 2, left: value ? 18 : 2, transition: 'left .15s' }} />
    </button>
  </div>
}
