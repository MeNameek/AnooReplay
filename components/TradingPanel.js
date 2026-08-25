import { useState } from 'react';

export default function TradingPanel({ symbol, currentPrice, positions, onOpenPosition, onClosePosition, account }) {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('long');
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');

  const handleSubmit = () => {
    const order = {
      symbol,
      side,
      qty: parseInt(qty) || 1,
      type: orderType,
      price: orderType === 'limit' ? parseFloat(limitPrice) : currentPrice,
      stopPrice: orderType === 'stop' || orderType === 'stop-limit' ? parseFloat(stopPrice) : null,
    };
    onOpenPosition(order);
  };

  const pnlColor = account.totalPnl >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)';

  return (
    <div className="trading-panel">
      <div className="panel-section">
        <div className="panel-title">ACCOUNT</div>
        <div className="account-info">
          <div className="account-stat">
            <div className="account-stat-label">BALANCE</div>
            <div className="account-stat-value">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="account-stat">
            <div className="account-stat-label">EQUITY</div>
            <div className="account-stat-value">
              ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="account-stat">
            <div className="account-stat-label">P&amp;L</div>
            <div className="account-stat-value" style={{ color: pnlColor }}>
              {account.totalPnl >= 0 ? '+' : ''}{account.totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="account-stat">
            <div className="account-stat-label">POSITIONS</div>
            <div className="account-stat-value">{positions.length}</div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">NEW ORDER</div>
        <div className="order-type-tabs">
          {['market', 'limit', 'stop'].map(type => (
            <button
              key={type}
              className={`order-type-tab ${orderType === type ? 'active' : ''}`}
              onClick={() => setOrderType(type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {orderType === 'limit' && (
          <div className="order-input">
            <label>Limit Price</label>
            <input
              type="number"
              step="0.25"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={currentPrice ? currentPrice.toFixed(2) : ''}
            />
          </div>
        )}

        {orderType === 'stop' && (
          <div className="order-input">
            <label>Stop Price</label>
            <input
              type="number"
              step="0.25"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder={currentPrice ? currentPrice.toFixed(2) : ''}
            />
          </div>
        )}

        <div className="order-input">
          <label>Quantity (Contracts)</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        <div className="order-buttons">
          <button className="buy-btn" onClick={() => { setSide('long'); handleSubmit(); }}>
            BUY / LONG
          </button>
          <button className="sell-btn" onClick={() => { setSide('short'); handleSubmit(); }}>
            SELL / SHORT
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">POSITIONS ({positions.length})</div>
        {positions.length === 0 ? (
          <div className="no-trades">No open positions</div>
        ) : (
          <div className="positions-list">
            {positions.map((pos, i) => {
              const pnl = pos.side === 'long'
                ? (currentPrice - pos.entryPrice) * pos.qty * pos.tickValue / pos.tickSize
                : (pos.entryPrice - currentPrice) * pos.qty * pos.tickValue / pos.tickSize;

              const pnlStyle = { color: pnl >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' };
              const sideClass = pos.side === 'long' ? 'long' : 'short';

              return (
                <div key={i} className="position-item">
                  <div className="position-header">
                    <span className={`position-side ${sideClass}`}>
                      {pos.side.toUpperCase()} {pos.qty}x {pos.symbol}
                    </span>
                    <span className="position-pnl" style={pnlStyle}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="position-details">
                    <div className="position-detail">
                      Entry <span>{pos.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="position-detail">
                      Current <span>{currentPrice ? currentPrice.toFixed(2) : '--'}</span>
                    </div>
                    <div className="position-detail">
                      Type <span>{pos.type}</span>
                    </div>
                    <div className="position-detail">
                      Time <span>{new Date(pos.time * 1000).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <button className="close-position-btn" onClick={() => onClosePosition(i, currentPrice)}>
                    CLOSE POSITION
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-title">TODAY&apos;S TRADES</div>
        <div className="no-trades" style={{ fontSize: '11px' }}>
          Trades appear here after closing
        </div>
      </div>
    </div>
  );
}
