import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CONTRACTS } from '../lib/contracts';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Sessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [formName, setFormName] = useState('MNQ session');
  const [formBalance, setFormBalance] = useState('100000');
  const [formSymbol, setFormSymbol] = useState('MNQ');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('anoreplay:sessions') || '[]');
      const loaded = [];
      for (const id of ids) {
        const raw = localStorage.getItem('anoreplay:session:' + id);
        if (raw) loaded.push(JSON.parse(raw));
      }
      loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSessions(loaded);
    } catch (e) {}
  }, []);

  const deleteSession = useCallback((id) => {
    try {
      localStorage.removeItem('anoreplay:session:' + id);
      const ids = JSON.parse(localStorage.getItem('anoreplay:sessions') || '[]');
      localStorage.setItem('anoreplay:sessions', JSON.stringify(ids.filter(i => i !== id)));
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {}
  }, []);

  const createSession = useCallback(() => {
    const id = generateId();
    const session = {
      id,
      name: formName || `${formSymbol} session`,
      symbol: formSymbol,
      balance: parseFloat(formBalance) || 100000,
      startDate: formStartDate || '',
      endDate: formEndDate || '',
      note: formNote || '',
      createdAt: Date.now(),
      trades: [],
      positions: [],
      drawings: [],
    };
    try {
      const ids = JSON.parse(localStorage.getItem('anoreplay:sessions') || '[]');
      ids.push(id);
      localStorage.setItem('anoreplay:sessions', JSON.stringify(ids));
      localStorage.setItem('anoreplay:session:' + id, JSON.stringify(session));
    } catch (e) {}
    router.push('/backtest?session=' + id);
  }, [formName, formBalance, formSymbol, formStartDate, formEndDate, formNote, router]);

  const openSession = (id) => {
    router.push('/backtest?session=' + id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatBalance = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <>
      <Head><title>AnooReplay — Sessions</title></Head>
      <div className="sessions-page">
        <div className="sessions-header">
          <div className="sessions-header-left">
            <Link href="/start" className="back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <h1 className="sessions-title">Sessions</h1>
          </div>
          <button className="new-session-btn" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New session
          </button>
        </div>

        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div className="sessions-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span>No sessions yet</span>
              <span className="sessions-empty-sub">Create one to start backtesting</span>
            </div>
          ) : (
            sessions.map(s => (
              <div key={s.id} className="session-card" onClick={() => openSession(s.id)}>
                <div className="session-card-top">
                  <div className="session-card-name">{s.name}</div>
                  <div className="session-card-actions">
                    <button className="session-delete-btn" title="Delete session" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div className="session-card-meta">
                  <span className="session-card-symbol">{s.symbol}</span>
                  <span className="session-card-sep">&middot;</span>
                  <span>{s.startDate ? formatDate(s.startDate) : 'Any start'}{s.endDate ? ` → ${formatDate(s.endDate)}` : ''}</span>
                </div>
                <div className="session-card-balance">{formatBalance(s.balance || 100000)}</div>
                {s.note && <div className="session-card-note">{s.note}</div>}
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-box session-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">New session</span>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="session-form-field">
                  <label>Name</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="MNQ session" />
                </div>

                <div className="session-form-field">
                  <label>Starting balance</label>
                  <div className="session-form-balance">
                    <span className="session-form-dollar">$</span>
                    <input type="number" value={formBalance} onChange={e => setFormBalance(e.target.value)} />
                  </div>
                  <div className="session-form-presets">
                    {['100000', '50000', '25000', '10000'].map(v => (
                      <button key={v} className={`session-preset-btn ${formBalance === v ? 'active' : ''}`} onClick={() => setFormBalance(v)}>
                        {parseInt(v) >= 100000 ? `${parseInt(v) / 1000}K` : `$${parseInt(v).toLocaleString()}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="session-form-field">
                  <label>Instrument</label>
                  <div className="session-form-select-wrap">
                    <select value={formSymbol} onChange={e => setFormSymbol(e.target.value)}>
                      {Object.keys(CONTRACTS).map(s => (
                        <option key={s} value={s}>{s} — {CONTRACTS[s].name}</option>
                      ))}
                    </select>
                    <svg className="session-form-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <div className="session-form-field">
                  <label>Backtest window <span className="session-form-optional">(optional — opens the chart at the start date)</span></label>
                  <div className="session-form-dates">
                    <div className="session-form-date">
                      <label className="session-form-date-label">Start date</label>
                      <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                    </div>
                    <svg className="session-form-date-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <div className="session-form-date">
                      <label className="session-form-date-label">End date</label>
                      <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="session-form-field">
                  <label>Note / goal <span className="session-form-optional">(optional)</span></label>
                  <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="e.g. London reversals, 1% risk, target +$2k" />
                </div>

                <div className="session-form-actions">
                  <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="modal-btn apply" onClick={createSession}>Create &amp; open →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
