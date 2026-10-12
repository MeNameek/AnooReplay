import { useState } from 'react'
import { TrendingUp, TrendingDown, X, ChevronDown, ChevronUp } from 'lucide-react'

type Position = { side:'long'|'short'; qty:number; entry:number; tp?:number; sl?:number }
type Order = { id:string; side:'long'|'short'; type:'Market'|'Limit'|'Stop'; price:number; tp?:number; sl?:number; qty:number }

type Props = {
  price?: number
  contracts: number
  setContracts: (n:number)=>void
  orderType: 'Market'|'Limit'|'Stop'
  setOrderType: (t:'Market'|'Limit'|'Stop')=>void
  limitPrice: number
  setLimitPrice: (n:number)=>void
  tpEnabled: boolean; setTpEnabled: (v:boolean)=>void; tpTicks: number; setTpTicks:(n:number)=>void
  slEnabled: boolean; setSlEnabled: (v:boolean)=>void; slTicks: number; setSlTicks:(n:number)=>void
  riskPct: string; setRiskPct:(v:string)=>void
  position: Position | null
  orders: Order[]
  onBuy: ()=>void
  onSell: ()=>void
  onClose: ()=>void
  equity: number
  realized: number
  orderSide: 'long'|'short'
  setOrderSide: (s:'long'|'short')=>void
}

export default function RightPanel({ price, contracts, setContracts, orderType, setOrderType, limitPrice, setLimitPrice, tpEnabled, setTpEnabled, tpTicks, setTpTicks, slEnabled, setSlEnabled, slTicks, setSlTicks, riskPct, setRiskPct, position, orders, onBuy, onSell, onClose, equity, realized, orderSide, setOrderSide }: Props) {
  const p = price ?? limitPrice ?? 28991
  const tickVal = 0.50
  const tickSize = 0.25
  const pointValue = 2
  const [showExits, setShowExits] = useState(true)
  
  const tp = tpEnabled ? (orderSide === 'long' ? p + tpTicks * tickSize : p - tpTicks * tickSize) : undefined
  const sl = slEnabled ? (orderSide === 'long' ? p - slTicks * tickSize : p + slTicks * tickSize) : undefined
  const tpPnl = tp ? Math.abs(tp - p) * contracts * pointValue : 0
  const slPnl = sl ? Math.abs(sl - p) * contracts * pointValue : 0
  
  const handleConfirmOrder = () => {
    if (orderSide === 'long') onBuy()
    else onSell()
  }

  return (
    <div style={{ width:280, background:'#0a0a0b', borderLeft:'1px solid #1a1a1e', display:'flex', flexDirection:'column', overflowY:'auto', fontFamily:'Inter, system-ui, -apple-system', fontSize:11 }}>
      <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1a1a1e' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:13, color:'#fff', fontFamily:'Inter' }}>∼ MNQ</div>
        <div style={{ display:'flex', gap:6 }}>
          <button style={{ width:22,height:22,borderRadius:6,border:'none',background:'#1a1a1e',color:'#71717a',cursor:'pointer' }}>▦</button>
          <button style={{ width:22,height:22,borderRadius:6,border:'none',background:'#1a1a1e',color:'#71717a',cursor:'pointer' }}>◧</button>
          <button style={{ width:22,height:22,borderRadius:6,border:'none',background:'transparent',color:'#71717a',cursor:'pointer' }}>✕</button>
        </div>
      </div>

      <div style={{ margin:'10px 12px', display:'flex', gap:8 }}>
        <button 
          onClick={() => setOrderSide('long')} 
          style={{ 
            flex:1, 
            background: orderSide === 'long' ? '#fff' : '#1a1a1e', 
            border:'none', 
            borderRadius:8, 
            padding:'8px 10px', 
            textAlign:'left', 
            cursor:'pointer',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize:9, letterSpacing:1, color: orderSide === 'long' ? '#71717a' : '#71717a', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
            <TrendingUp size={12} color={orderSide === 'long' ? '#10b981' : '#71717a'} />
            BUY
          </div>
          <div style={{ fontSize:13, color: orderSide === 'long' ? '#000' : '#e5e7eb', fontWeight:700 }}>{p.toFixed(2)}</div>
        </button>
        <button 
          onClick={() => setOrderSide('short')} 
          style={{ 
            flex:1, 
            background: orderSide === 'short' ? '#ef4444' : '#1a1a1e', 
            border:'none', 
            borderRadius:8, 
            padding:'8px 10px', 
            textAlign:'right', 
            cursor:'pointer',
            transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize:9, letterSpacing:1, color: orderSide === 'short' ? '#fff' : '#71717a', fontWeight:700, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
            SELL
            <TrendingDown size={12} color={orderSide === 'short' ? '#fff' : '#71717a'} />
          </div>
          <div style={{ fontSize:13, color: orderSide === 'short' ? '#fff' : '#e5e7eb', fontWeight:700, textAlign:'right' }}>{p.toFixed(2)}</div>
        </button>
      </div>

      <div style={{ margin:'0 12px', display:'flex', background:'#1a1a1e', borderRadius:8, padding:2, gap:2 }}>
        {(['Market','Limit','Stop'] as const).map(l=> (
          <button key={l} onClick={()=>setOrderType(l)} style={{ flex:1, padding:'6px 0', borderRadius:6, border:'none', background: orderType===l ? '#0f0f0f' : 'transparent', color: orderType===l?'#fff':'#71717a', fontSize:11, fontWeight: orderType===l?700:400, cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ margin:'8px 12px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>CONTRACTS</span>
        {orderType!=='Market' && <span style={{ fontSize:9, color:'#71717a' }}>LIMIT PRICE</span>}
      </div>
      <div style={{ margin:'4px 12px', display:'flex', gap:6, alignItems:'center' }}>
        <button onClick={()=>setContracts(Math.max(1,contracts-1))} style={{ width:28,height:28,borderRadius:6,border:'none',background:'#1a1a1e',color:'#fff',cursor:'pointer',fontSize:16 }}>−</button>
        <input value={contracts} onChange={e=> setContracts(Math.max(1, parseInt(e.target.value)||1))} style={{ flex:1, background:'#1a1a1e', border:'1px solid #27272a', borderRadius:6, padding:'6px 0', textAlign:'center', color:'#fff', fontSize:12, outline:'none' }} />
        <button onClick={()=>setContracts(contracts+1)} style={{ width:28,height:28,borderRadius:6,border:'none',background:'#1a1a1e',color:'#fff',cursor:'pointer',fontSize:16 }}>+</button>
        {orderType!=='Market' && <input type="number" value={Number.isFinite(limitPrice)?limitPrice:p} onChange={e=> setLimitPrice(parseFloat(e.target.value)||p)} style={{ width:86, background:'#1a1a1e', border:'1px solid #27272a', color:'#fff', borderRadius:6, padding:'6px 6px', fontSize:11, outline:'none' }} />}
      </div>

      <div style={{ margin:'8px 12px', background:'#111114', border:'1px solid #1a1a1e', borderRadius:10, padding:8 }}>
        <button onClick={()=>setShowExits(!showExits)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer' }}>
          <span style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>EXITS</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:9, background:'#1a1a1e', borderRadius:6, padding:'2px 4px', color:'#71717a' }}>Ticks</span>
            {showExits ? <ChevronUp size={14} color="#71717a" /> : <ChevronDown size={14} color="#71717a" />}
          </span>
        </button>
        
        {showExits && (
          <>
            <div style={{ height:2, background:'linear-gradient(to right, #10b981 50%, #ef4444 50%)', borderRadius:1, margin:'6px 0' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <button onClick={()=>setTpEnabled(!tpEnabled)} style={{ width:30,height:16, borderRadius:8, border:'none', background: tpEnabled ? '#10b981' : '#27272a', position:'relative', cursor:'pointer' }}>
                <span style={{ position:'absolute', width:12,height:12, background:'#fff', borderRadius:6, top:2, left: tpEnabled?16:2, transition:'left .15s' }} />
              </button>
              <span style={{ fontSize:11, color:'#a1a1aa', flex:1 }}>Take profit</span>
              <input value={tpTicks} onChange={e=> setTpTicks(parseInt(e.target.value)||0)} style={{ width:48, background:'#1a1a1e', border:'1px solid #27272a', color:'#fff', borderRadius:6, padding:'3px 6px', fontSize:11, textAlign:'center', outline:'none' }} />
              <span style={{ fontSize:9, color:'#71717a' }}>tk</span>
            </div>
            {tpEnabled && tp && (
              <div style={{ marginTop:4, fontSize:10, color:'#10b981', textAlign:'right' }}>
                TP: {tp.toFixed(2)} → +${tpPnl.toFixed(2)}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <button onClick={()=>setSlEnabled(!slEnabled)} style={{ width:30,height:16, borderRadius:8, border:'none', background: slEnabled ? '#ef4444' : '#27272a', position:'relative', cursor:'pointer' }}>
                <span style={{ position:'absolute', width:12,height:12, background:'#fff', borderRadius:6, top:2, left: slEnabled?16:2, transition:'left .15s' }} />
              </button>
              <span style={{ fontSize:11, color:'#a1a1aa', flex:1 }}>Stop loss</span>
              <input value={slTicks} onChange={e=> setSlTicks(parseInt(e.target.value)||0)} style={{ width:48, background:'#1a1a1e', border:'1px solid #27272a', color:'#fff', borderRadius:6, padding:'3px 6px', fontSize:11, textAlign:'center', outline:'none' }} />
              <span style={{ fontSize:9, color:'#71717a' }}>tk</span>
            </div>
            {slEnabled && sl && (
              <div style={{ marginTop:4, fontSize:10, color:'#ef4444', textAlign:'right' }}>
                SL: {sl.toFixed(2)} → -${slPnl.toFixed(2)}
              </div>
            )}
            <div style={{ marginTop:8, display:'flex', gap:4, fontSize:10, alignItems:'center' }}>
              <span style={{ color:'#71717a', fontSize:9 }}>Risk %</span>
              <span style={{ marginLeft:'auto', display:'flex', gap:2 }}>
                {['0.25%','0.5%','1%','2%','1'].map(v=> (
                  <button key={v} onClick={()=>setRiskPct(v)} style={{ padding:'2px 6px', borderRadius:6, border:'none', background: riskPct===v ? '#2563eb' : '#1a1a1e', color: riskPct===v ? '#fff' : '#71717a', fontSize:10, cursor:'pointer' }}>
                    {v}
                  </button>
                ))}
              </span>
            </div>
          </>
        )}
      </div>

      <div style={{ margin:'8px 12px' }}>
        <div style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>ORDER INFO</div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0', color:'#71717a' }}>
          <span>Tick value</span>
          <span style={{ color:'#fff' }}>${tickVal.toFixed(2)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0', color:'#71717a' }}>
          <span>Trade value</span>
          <span style={{ color:'#fff', fontWeight:600 }}>${(contracts * p * pointValue).toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0', color:'#71717a' }}>
          <span>Equity</span>
          <span style={{ color:'#fff', fontWeight:600 }}>${equity.toLocaleString()}</span>
        </div>
        <div style={{ height:1, background:'#1a1a1e', margin:'8px 0' }} />
        <button 
          onClick={position ? onClose : handleConfirmOrder} 
          style={{ 
            width:'100%', 
            background: position ? '#1a1a1e' : (orderSide === 'long' ? '#fff' : '#ef4444'), 
            color: position ? '#fff' : (orderSide === 'long' ? '#000' : '#fff'), 
            border:'1px solid #27272a', 
            borderRadius:10, 
            padding:'10px 0', 
            fontWeight:700, 
            fontSize:12, 
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:6
          }}
        >
          {position ? (
            <>Close {position.side} {position.qty}</>
          ) : (
            <>
              {orderSide === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {orderSide === 'long' ? 'Buy' : 'Sell'} {contracts} MNQ
            </>
          )}
          <div style={{ fontSize:9, fontWeight:400, opacity:0.6 }}>
            {orderType} {orderType!=='Market' ? `@ ${(Number.isFinite(limitPrice)?limitPrice:p).toFixed(2)}` : 'MARKET'}
          </div>
        </button>
      </div>

      <div style={{ margin:'0 12px', padding:'8px 0', borderTop:'1px solid #1a1a1e' }}>
        <div style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>POSITION</div>
        {position ? (
          <div style={{ marginTop:6, background:'#0f172a', border:'1px solid #1e40af', borderRadius:8, padding:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
              <span style={{ color:'#60a5fa', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                {position.side === 'long' ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                {position.side.toUpperCase()} {position.qty}
              </span>
              <span style={{ color:'#a1a1aa' }}>@ {position.entry.toFixed(2)}</span>
            </div>
            <div style={{ fontSize:11, color: (p - position.entry)*(position.side==='long'?1:-1) >=0 ? '#10b981' : '#ef4444', fontWeight:700, marginTop:4 }}>
              {((p - position.entry)*(position.side==='long'?1:-1)*contracts*pointValue).toFixed(2)} USD
            </div>
          </div>
        ) : (
          <div style={{ fontSize:11, color:'#52525b', marginTop:4 }}>Flat</div>
        )}
      </div>
      
      <div style={{ margin:'0 12px', padding:'8px 0', borderTop:'1px solid #1a1a1e' }}>
        <div style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>WORKING ORDERS {orders.length? `(${orders.length})`:''}</div>
        {orders.length===0 ? (
          <div style={{ fontSize:11, color:'#52525b', marginTop:4 }}>None — drag lines on chart to adjust</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:6 }}>
            {orders.map(o=> (
              <div key={o.id} style={{ background:'#1a1a1e', borderRadius:6, padding:'6px 8px', display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color: o.side==='long'?'#10b981':'#ef4444' }}>
                  {o.side==='long'?'Buy':'Sell'} {o.qty} @ {o.price.toFixed(2)}
                </span>
                <span style={{ color:'#71717a' }}>{o.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop:'auto', padding:'10px 12px', borderTop:'1px solid #1a1a1e', display:'flex', justifyContent:'space-between', fontSize:10 }}>
        <span style={{ color:'#71717a', fontWeight:700, letterSpacing:1 }}>REALIZED P&L</span>
        <span style={{ color: realized>=0 ? '#10b981' : '#ef4444', fontWeight:700 }}>${realized.toFixed(2)}</span>
      </div>
    </div>
  )
}
