import { useCallback, useRef } from 'react';

export default function ReplayControls({
  isPlaying, onPlayPause, onStepForward, onStepBack,
  onSkipToStart, onSkipToEnd,
  speed, onSpeedChange, currentIndex, totalBars, onSeek, currentTime,
}) {
  const progress = totalBars > 0 ? (currentIndex / (totalBars - 1)) * 100 : 0;
  const dragging = useRef(false);

  const handleProgressAction = useCallback((e) => {
    if (totalBars <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    onSeek(Math.round(pct * (totalBars - 1)));
  }, [totalBars, onSeek]);

  const handleProgressMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    handleProgressAction(e);
    const onMove = (ev) => { if (dragging.current) handleProgressAction(ev); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [handleProgressAction]);

  const fmt = (t) => {
    if (!t) return '';
    const d = new Date(t * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}  ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  };

  return (
    <div className="replay-bar">
      {isPlaying && (
        <div className="replay-badge">
          <span className="replay-badge-dot" />
          REPLAY
        </div>
      )}

      <div className="replay-transport">
        <button className="replay-btn" onClick={onSkipToStart} title="Start">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
        </button>
        <button className="replay-btn" onClick={onStepBack} title="Step back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
        </button>
        <button className={`replay-btn ${isPlaying ? 'playing' : ''}`} onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <button className="replay-btn" onClick={onStepForward} title="Step forward">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
        </button>
        <button className="replay-btn" onClick={onSkipToEnd} title="End">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>
      </div>

      <div className="replay-progress" onMouseDown={handleProgressMouseDown}>
        <div className="replay-progress-fill" style={{ width: `${progress}%` }} />
        <div className="replay-progress-thumb" style={{ left: `${progress}%` }} />
      </div>

      <div className="replay-speed">
        {[1, 2, 5, 10, 25, 50].map(s => (
          <button key={s} className={`speed-btn ${speed === s ? 'active' : ''}`} onClick={() => onSpeedChange(s)}>
            {s}x
          </button>
        ))}
      </div>

      <div className="replay-time">
        {fmt(currentTime)} &middot; {currentIndex + 1}/{totalBars}
      </div>
    </div>
  );
}
