import { useState } from 'react';

const PRESETS = {
  dark: { label: 'Dark', bgColor: '#000000', gridColor: '#141414', textColor: '#52525b', upColor: '#26a69a', downColor: '#ef5350', wickUp: '#26a69a', wickDown: '#ef5350' },
  tv: { label: 'TradingView', bgColor: '#131722', gridColor: '#1e222d', textColor: '#787b86', upColor: '#26a69a', downColor: '#ef5350', wickUp: '#26a69a', wickDown: '#ef5350' },
  blue: { label: 'Blue Ocean', bgColor: '#0a1628', gridColor: '#132040', textColor: '#5a7da8', upColor: '#26a69a', downColor: '#ef5350', wickUp: '#26a69a', wickDown: '#ef5350' },
  light: { label: 'Light', bgColor: '#ffffff', gridColor: '#f0f0f0', textColor: '#666666', upColor: '#26a69a', downColor: '#ef5350', wickUp: '#26a69a', wickDown: '#ef5350' },
  matrix: { label: 'Matrix', bgColor: '#0a0f0a', gridColor: '#0d1a0d', textColor: '#2d5a2d', upColor: '#00ff41', downColor: '#008f11', wickUp: '#00ff41', wickDown: '#008f11' },
  purple: { label: 'Synthwave', bgColor: '#1a0a2e', gridColor: '#2d1b4e', textColor: '#8b5cf6', upColor: '#c084fc', downColor: '#f472b6', wickUp: '#c084fc', wickDown: '#f472b6' },
};

export default function SettingsModal({ open, onClose, settings, onUpdate }) {
  const [local, setLocal] = useState(settings);

  if (!open) return null;

  const handleChange = (key, value) => {
    setLocal(p => ({ ...p, [key]: value }));
  };

  const apply = () => {
    onUpdate(local);
    onClose();
  };

  const applyPreset = (key) => {
    const preset = PRESETS[key];
    if (!preset) return;
    const { label, ...colors } = preset;
    setLocal(p => ({ ...p, ...colors }));
    onUpdate({ ...local, ...colors });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Chart Settings</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <span className="settings-label">Presets</span>
            <div className="settings-presets">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button key={key} className="settings-preset" onClick={() => applyPreset(key)}>
                  <span className="preset-dot" style={{ background: preset.bgColor, border: `1px solid ${preset.upColor}` }} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <span className="settings-label">Colors</span>
            <div className="settings-grid">
              <div className="settings-field">
                <label>Background</label>
                <div className="settings-color">
                  <input type="color" value={local.bgColor} onChange={e => handleChange('bgColor', e.target.value)} />
                  <span>{local.bgColor}</span>
                </div>
              </div>
              <div className="settings-field">
                <label>Grid</label>
                <div className="settings-color">
                  <input type="color" value={local.gridColor} onChange={e => handleChange('gridColor', e.target.value)} />
                  <span>{local.gridColor}</span>
                </div>
              </div>
              <div className="settings-field">
                <label>Text</label>
                <div className="settings-color">
                  <input type="color" value={local.textColor} onChange={e => handleChange('textColor', e.target.value)} />
                  <span>{local.textColor}</span>
                </div>
              </div>
              <div className="settings-field">
                <label>Up Candle</label>
                <div className="settings-color">
                  <input type="color" value={local.upColor} onChange={e => handleChange('upColor', e.target.value)} />
                  <span>{local.upColor}</span>
                </div>
              </div>
              <div className="settings-field">
                <label>Down Candle</label>
                <div className="settings-color">
                  <input type="color" value={local.downColor} onChange={e => handleChange('downColor', e.target.value)} />
                  <span>{local.downColor}</span>
                </div>
              </div>
              <div className="settings-field">
                <label>Wick Up</label>
                <div className="settings-color">
                  <input type="color" value={local.wickUp} onChange={e => handleChange('wickUp', e.target.value)} />
                  <span>{local.wickUp}</span>
                </div>
              </div>
              <div className="settings-field">
                <label>Wick Down</label>
                <div className="settings-color">
                  <input type="color" value={local.wickDown} onChange={e => handleChange('wickDown', e.target.value)} />
                  <span>{local.wickDown}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
            <button className="modal-btn apply" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
