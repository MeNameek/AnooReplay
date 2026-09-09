type Props = {
  price: number | undefined
  settingsOpen: () => void
}

// Nami right panel exact clone: black 280px, rounded sections, placeholders for Order/DOM/Market etc.
export default function RightPanel({ price, settingsOpen }: Props) {
  const p = price ?? 28991.00
  return (
    <div style={{ width: 280, background:'#0a0a0b', borderLeft:'1px solid #1a1a1e', display:'flex', flexDirection:'column', overflowY:'auto', fontFamily:'Inter, system-ui' }}>
      {/* header */}
      <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1a1a1e' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:13, color:'#fff' }}><span style={{ opacity:0.6 }}>∼</span> MNQ</div>
        <div style={{ display:'flex', gap:6 }}>
          <button style={{ width:22, height:22, borderRadius:6, border:'none', background:'#1a1a1e', color:'#71717a' }}>▦</button>
          <button style={{ width:22, height:22, borderRadius:6, border:'none', background:'#1a1a1e', color:'#71717a' }}>⚙</button>
          <button style={{ width:22, height:22, borderRadius:6, border:'none', background:'transparent', color:'#71717a' }}>✕</button>
        </div>
      </div>

      {/* Order / DOM tabs */}
      <div style={{ margin:'10px 12px', display:'flex', background:'#1a1a1e', borderRadius:8, padding:2, gap:2 }}>
        <button style={{ flex:1, padding:'6px 0', borderRadius:6, border:'none', background:'#0f0f0f', color:'#fff', fontSize:11, fontWeight:700 }}>Order</button>
        <button style={{ flex:1, padding:'6px 0', borderRadius:6, border:'none', background:'transparent', color:'#71717a', fontSize:11 }}>DOM</button>
      </div>

      {/* Sell/Buy */}
      <div style={{ margin:'0 12px', display:'flex', gap:8 }}>
        <div style={{ flex:1, background:'#1a1a1e', borderRadius:8, padding:'8px 10px' }}>
          <div style={{ fontSize:9, letterSpacing:1, color:'#71717a', fontWeight:700 }}>SELL</div>
          <div style={{ fontSize:13, color:'#e5e7eb', fontWeight:700 }}>{p.toFixed(2)}</div>
        </div>
        <div style={{ position:'relative', flex:1 }}>
          <div style={{ background:'#1a1a1e', borderRadius:8, padding:'8px 10px', borderLeft:'3px solid #fff' }}>
            <div style={{ fontSize:9, letterSpacing:1, color:'#71717a', fontWeight:700, textAlign:'right' }}>BUY</div>
            <div style={{ fontSize:13, color:'#fff', fontWeight:700, textAlign:'right' }}>{p.toFixed(2)}</div>
          </div>
          <div style={{ position:'absolute', left:-10, top:'50%', transform:'translateY(-50%)', background:'#dbeafe', color:'#1e3a8a', fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4, border:'1px solid #93c5fd' }}>0.25</div>
        </div>
      </div>

      {/* Market Limit Stop */}
      <div style={{ margin:'8px 12px', display:'flex', background:'#1a1a1e', borderRadius:8, padding:2, gap:2 }}>
        {['Market','Limit','Stop'].map(l=> <button key={l} style={{ flex:1, padding:'5px 0', borderRadius:6, border:'none', background: l==='Market'?'#0f0f0f':'transparent', color: l==='Market'?'#fff':'#71717a', fontSize:11, fontWeight: l==='Market'?700:400 }}>{l}</button>)}
      </div>

      <div style={{ margin:'0 12px', fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>CONTRACTS</div>
      <div style={{ margin:'4px 12px', display:'flex', gap:6, alignItems:'center' }}>
        <button style={{ width:28, height:28, borderRadius:6, border:'none', background:'#1a1a1e', color:'#71717a' }}>−</button>
        <div style={{ flex:1, background:'#1a1a1e', borderRadius:6, padding:'6px 0', textAlign:'center', color:'#fff', fontSize:12 }}>1</div>
        <button style={{ width:28, height:28, borderRadius:6, border:'none', background:'#1a1a1e', color:'#71717a' }}>+</button>
      </div>

      <div style={{ margin:'8px 12px', background:'#111114', border:'1px solid #1a1a1e', borderRadius:10, padding:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>EXITS</span>
          <span style={{ fontSize:10, background:'#1a1a1e', borderRadius:6, padding:'2px 4px', color:'#71717a' }}>Ticks <b style={{ color:'#fff' }}>Pts</b></span>
        </div>
        {[
          { l:'Take profit', v:'80' },
          { l:'Stop loss', v:'40' },
        ].map(r=>(
          <div key={r.l} style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <span style={{ width:32, height:18, borderRadius:9, background:'#27272a', position:'relative', display:'inline-block' }}><span style={{ position:'absolute', width:14, height:14, background:'#fff', borderRadius:7, top:2, left:2 }} /></span>
            <span style={{ fontSize:11, color:'#a1a1aa', flex:1 }}>{r.l}</span>
            <span style={{ fontSize:11, color:'#fff', background:'#1a1a1e', padding:'2px 6px', borderRadius:6 }}>{r.v}</span>
            <span style={{ fontSize:10, color:'#71717a' }}>tk</span>
          </div>
        ))}
        <div style={{ marginTop:8, display:'flex', gap:6, fontSize:10, color:'#71717a' }}>
          Risk % <span style={{ marginLeft:'auto', display:'flex', gap:6 }}><span>0.25%</span><span>0.5%</span><span>1%</span><span>2%</span><span>1</span></span>
        </div>
        <div style={{ fontSize:9, color:'#52525b', textAlign:'center', marginTop:4 }}>Set a stop loss to size by risk</div>
      </div>

      <div style={{ margin:'8px 12px' }}>
        <div style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>ORDER INFO</div>
        {[
          ['Tick value','$0.50'],
          ['Trade value','$57,982.00'],
          ['Equity','$51,548.00'],
        ].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0', color:'#a1a1aa' }}><span>{k}</span><span style={{ color:'#fff', fontWeight:600 }}>{v}</span></div>
        ))}
        <div style={{ height:1, background:'#1a1a1e', margin:'8px 0' }} />
        <button style={{ width:'100%', background:'#fff', color:'#000', border:'none', borderRadius:10, padding:'10px 0', fontWeight:700, fontSize:12, lineHeight:1 }}>
          Buy 1 MNQ <div style={{ fontSize:9, fontWeight:400, opacity:0.6 }}>MARKET</div>
        </button>
      </div>

      <div style={{ margin:'0 12px', padding:'8px 0', borderTop:'1px solid #1a1a1e' }}>
        <div style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>POSITION</div>
        <div style={{ fontSize:11, color:'#52525b', marginTop:4 }}>Flat</div>
      </div>
      <div style={{ margin:'0 12px', padding:'8px 0', borderTop:'1px solid #1a1a1e' }}>
        <div style={{ fontSize:10, letterSpacing:1, color:'#71717a', fontWeight:700 }}>WORKING ORDERS</div>
        <div style={{ fontSize:11, color:'#52525b', marginTop:4 }}>None — drag lines on chart to adjust</div>
      </div>
      <div style={{ marginTop:'auto', padding:'10px 12px', borderTop:'1px solid #1a1a1e', display:'flex', justifyContent:'space-between', fontSize:10 }}>
        <span style={{ color:'#71717a', fontWeight:700, letterSpacing:1 }}>REALIZED P&L</span>
        <span style={{ color:'#10b981', fontWeight:700 }}>$1,548.00</span>
      </div>
    </div>
  )
}
