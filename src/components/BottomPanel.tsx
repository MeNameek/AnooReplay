import { useRef, useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'

type Trade = {
  id: number
  side: 'long' | 'short'
  qty: number
  entryDate: string
  entryPrice: number
  exitDate: string
  exitPrice: number
  pnl: number
}

type Props = {
  open: boolean
  height: number
  setHeight: (h: number) => void
  setOpen: (v: boolean) => void
  equity: number
  realized: number
  trades?: Trade[]
}

export default function BottomPanel({ open, height, setHeight, setOpen, equity, realized, trades = [] }: Props) {
  const dragRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = e.clientY
    const startH = height
    setIsDragging(true)
    
    const mv = (ev: MouseEvent) => {
      if (dragRef.current == null) return
      const dy = dragRef.current - ev.clientY
      const nh = Math.max(60, Math.min(window.innerHeight * 0.7, startH + dy))
      setHeight(nh)
      if (nh > 80) setOpen(true)
    }
    
    const up = () => {
      dragRef.current = null
      setIsDragging(false)
      window.removeEventListener('mousemove', mv)
      window.removeEventListener('mouseup', up)
    }
    
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
  }

  const defaultTrades = [
    { id: 1, side: 'long' as const, qty: 12, entryDate: 'May 01', entryPrice: 27777, exitDate: 'May 01', exitPrice: 27797, pnl: 480 },
    { id: 2, side: 'short' as const, qty: 13, entryDate: 'May 05', entryPrice: 28093, exitDate: 'May 05', exitPrice: 28075, pnl: 468 },
  ]

  const displayTrades = trades.length > 0 ? trades : defaultTrades

  return (
    <div 
      ref={containerRef}
      style={{ 
        background: open ? 'rgba(15, 15, 17, 0.95)' : 'rgba(10, 10, 11, 0.98)',
        borderTop: '1px solid rgba(39, 39, 42, 0.5)',
        backdropFilter: 'blur(20px)',
        display: 'flex', 
        flexDirection: 'column',
        transition: isDragging ? 'none' : 'background 0.2s',
      }}
    >
      <div 
        onMouseDown={onDown} 
        style={{ 
          height: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'row-resize', 
          background: 'transparent',
          position: 'relative',
        }}
      >
        <div style={{ 
          width: 40, 
          height: 4, 
          borderRadius: 2, 
          background: isDragging ? '#60a5fa' : '#3f3f46',
          transition: 'background 0.15s'
        }} />
      </div>
      
      {!open && (
        <button 
          onClick={() => setOpen(true)}
          style={{
            position: 'absolute',
            top: 16,
            right: 12,
            background: 'rgba(39, 39, 42, 0.8)',
            border: 'none',
            color: '#a1a1aa',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ChevronUp size={14} />
          Show Panel
        </button>
      )}
      
      {open && (
        <div style={{ 
          height, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '12px 16px 16px', 
          overflow: 'auto',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Inter, system-ui' }}>Account Performance</div>
              <select 
                defaultValue="may · $50k" 
                style={{ 
                  background: 'rgba(39, 39, 42, 0.6)', 
                  border: '1px solid rgba(63, 63, 70, 0.5)', 
                  color: '#fff', 
                  borderRadius: 8, 
                  padding: '6px 12px', 
                  fontSize: 11,
                  outline: 'none',
                  fontFamily: 'Inter, system-ui',
                }}
              >
                <option>may · $50k</option>
              </select>
            </div>
            <button 
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(39, 39, 42, 0.6)',
                border: 'none',
                color: '#a1a1aa',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ChevronDown size={14} />
              Hide
            </button>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ 
              minWidth: 180,
              background: 'rgba(39, 39, 42, 0.4)', 
              borderRadius: 12, 
              padding: 16,
              border: '1px solid rgba(63, 63, 70, 0.3)',
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: '#71717a', fontWeight: 600, marginBottom: 8 }}>NET P&L</div>
              <div style={{ fontSize: 28, color: realized >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontFamily: 'Inter, system-ui' }}>
                {realized >= 0 ? '+' : ''}{realized.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                {realized >= 0 ? '+' : ''}{(realized / 2).toFixed(0)} pts · {displayTrades.length} trades
              </div>
            </div>
            
            <div style={{ 
              flex: 1, 
              background: 'rgba(39, 39, 42, 0.4)', 
              border: '1px solid rgba(63, 63, 70, 0.3)', 
              borderRadius: 12, 
              padding: 16,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: '#71717a', fontWeight: 600, marginBottom: 8 }}>EQUITY CURVE</div>
              <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={realized >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={realized >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0 70 L50 65 L100 58 L150 60 L200 48 L250 42 L300 38 L350 32 L400 25" 
                  fill="none" 
                  stroke={realized >= 0 ? '#10b981' : '#ef4444'} 
                  strokeWidth="2"
                />
                <path 
                  d="M0 70 L50 65 L100 58 L150 60 L200 48 L250 42 L300 38 L350 32 L400 25 L400 80 L0 80 Z" 
                  fill="url(#equityGradient)"
                />
              </svg>
            </div>
          </div>

          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            background: 'rgba(39, 39, 42, 0.3)',
            borderRadius: 12,
            border: '1px solid rgba(63, 63, 70, 0.3)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, system-ui' }}>
              <thead>
                <tr style={{ color: '#71717a', fontSize: 10, letterSpacing: 0.5 }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>#</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>Side</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>Entry Date</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>Entry</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>Exit Date</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600 }}>Exit</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>P&L</th>
                </tr>
              </thead>
              <tbody style={{ color: '#e5e7eb' }}>
                {displayTrades.map((trade, i) => (
                  <tr 
                    key={trade.id} 
                    style={{ 
                      borderTop: '1px solid rgba(63, 63, 70, 0.3)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: '#71717a' }}>{trade.id}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: trade.side === 'long' ? '#60a5fa' : '#f87171',
                        fontWeight: 600,
                      }}>
                        {trade.side === 'long' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trade.side === 'long' ? 'Long' : 'Short'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>{trade.qty}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', color: '#a1a1aa' }}>{trade.entryDate}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: 'monospace' }}>{trade.entryPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', color: '#a1a1aa' }}>{trade.exitDate}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: 'monospace' }}>{trade.exitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: trade.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
