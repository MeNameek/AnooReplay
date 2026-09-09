type Props = {
  x: number; y: number; price: number | null
  onReset: () => void
  onHidePanels: () => void
  onCopyPrice: () => void
  onToggleExec: () => void
  execVisible: boolean
  onClose: () => void
}
export default function ContextMenu({ x, y, price, onReset, onHidePanels, onCopyPrice, onToggleExec, execVisible, onClose }: Props) {
  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:90 }} onClick={onClose} onContextMenu={e=>{e.preventDefault(); onClose()}} />
      <div style={{
        position:'fixed', left: Math.min(x, window.innerWidth-180), top: Math.min(y, window.innerHeight-150),
        background:'#fff', border:'1px solid #e5e5e5', borderRadius:10, boxShadow:'0 12px 32px rgba(0,0,0,0.18)',
        padding:'6px 0', minWidth:168, zIndex:100, fontFamily:'Inter, system-ui', fontSize:12
      }}>
        <button onClick={()=>{onReset(); onClose()}} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'none', border:'none', color:'#1f1f1f', cursor:'pointer', textAlign:'left' }}>
          <span style={{ width:14, textAlign:'center', opacity:0.6 }}>↺</span> Reset chart view
        </button>
        <button onClick={()=>{onHidePanels(); onClose()}} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'none', border:'none', color:'#1f1f1f', cursor:'pointer', textAlign:'left' }}>
          <span style={{ width:14, textAlign:'center', opacity:0.6 }}>▭</span> Hide panels
        </button>
        <button onClick={()=>{onCopyPrice(); onClose()}} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'none', border:'none', color:'#1f1f1f', cursor:'pointer', textAlign:'left' }}>
          <span style={{ width:14, textAlign:'center', opacity:0.6 }}>⎘</span> Copy price {price? price.toFixed(2):''}
        </button>
        <button onClick={()=>{onToggleExec(); onClose()}} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'none', border:'none', color:'#1f1f1f', cursor:'pointer', textAlign:'left' }}>
          <span style={{ width:14, textAlign:'center', opacity:0.6 }}>↓</span> {execVisible ? 'Hide' : 'Show'} execution marks
        </button>
      </div>
    </>
  )
}
