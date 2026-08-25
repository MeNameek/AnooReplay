import { useState } from 'react';

export default function TradingPanel({ symbol, currentPrice, positions, onOpenPosition, onClosePosition, account }) {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('long');
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');

  const handleSubmit = (orderSide) => {
    onOpenPosition({
      symbol,
      side: orderSide,
      qty: parseInt(qty) || 1,
      type: orderType,
      price: orderType === 'limit' ? parseFloat(limitPrice) || currentPrice : currentPrice,
      stopPrice: orderType === 'stop' ? parseFloat(stopPrice) || currentPrice : null,
    });
  };

  return (
    <div className="trading-panel">
      <div className="panel-section">
        <div className="panel-title">Account</div>
        <div className="account-info">
          <div>
            <div className="account-stat-label">Balance</div>
            <div className="account-stat-value">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="account-stat-label">P&amp;L</div>
            <div className="account-stat-value" style={{ color: account.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {account.totalPnl >= 0 ? '+' : ''}{account.totalPnl.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">Order</div>
        <div className="order-type-tabs">
          {['market', 'limit', 'stop'].map(t => (
            <button key={t} className={`order-type-tab ${orderType === t ? 'active' : ''}`} onClick={() => setOrderType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {orderType === 'limit' && (
          <div className="order-input">
            <label>Limit Price</label>
            <input type="number" step="0.25" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder={currentPrice?.toFixed(2) || ''} />
          </div>
        )}

        {orderType === 'stop' && (
          <div className="order-input">
            <label>Stop Price</label>
            <input type="number" step="0.25" value={stopPrice} onChange={e => setStopPrice(e.target.value)} placeholder={currentPrice?.toFixed(2) || ''} />
          </div>
        )}

        <div className="order-input">
          <label>Qty</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
        </div>

        <div className="order-buttons">
          <button className="buy-btn" onClick={() => handleSubmit('long')}>Buy</button>
          <button className="sell-btn" onClick={() => handleSubmit('short')}>Sell</button>
        </div>
      </div>

      <div className="panel-section" style={{ flex: 1, overflow: 'auto' }}>
        <div className="panel-title">Positions ({positions.length})</div>
        {positions.length === 0 ? (
          <div className="no-trades">No open positions</div>
        ) : (
          <div className="positions-list">
            {positions.map((pos, i) => {
              const pnl = pos.side === 'long'
                ? (currentPrice - pos.entryPrice) * pos.qty * pos.tickValue / pos.tickSize
                : (pos.entryPrice - currentPrice) * pos.qty * pos.tickValue / pos.tickSize;

              return (
                <div key={i} className="position-item">
                  <div className="position-header">
                    <span className={`position-side ${pos.side}`}>
                      {pos.side === 'long' ? 'LONG' : 'SHORT'} {pos.qty}x
                    </span>
                    <span className="position-pnl" style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="position-details">
                    <div className="position-detail">Entry <span>{pos.entryPrice.toFixed(2)}</span></div>
                    <div className="position-detail">Now <span>{currentPrice?.toFixed(2) || '—'}</span></div>
                  </div>
                  <button className="close-position-btn" onClick={() => onClosePosition(i, currentPrice)}>
                    Close
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
