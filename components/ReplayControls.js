export default function ReplayControls({
  isPlaying, onPlayPause, onStepForward, onStepBack,
  onSkipToStart, onSkipToEnd, onReset,
  speed, onSpeedChange, currentIndex, totalBars, onSeek, currentTime,
}) {
  const progress = totalBars > 0 ? (currentIndex / (totalBars - 1)) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(totalBars - 1, Math.floor(pct * (totalBars - 1)))));
  };

  const fmt = (t) => {
    if (!t) return '—';
    const d = new Date(t * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  return (
    <div className="replay-bar">
      <button className="replay-btn" onClick={onSkipToStart} title="Start">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
      </button>

      <button className="replay-btn" onClick={onStepBack} title="Step back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
      </button>

      <button className={`replay-btn ${isPlaying ? 'playing' : ''}`} onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>

      <button className="replay-btn" onClick={onStepForward} title="Step forward">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
      </button>

      <button className="replay-btn" onClick={onSkipToEnd} title="End">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      </button>

      <div className="replay-progress" onClick={handleProgressClick}>
        <div className="replay-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="replay-speed">
        {[1, 2, 5, 10, 25, 50].map(s => (
          <button key={s} className={`speed-btn ${speed === s ? 'active' : ''}`} onClick={() => onSpeedChange(s)}>
            {s}x
          </button>
        ))}
      </div>

      <div className="replay-time">
        {fmt(currentTime)} · {currentIndex + 1}/{totalBars}
      </div>
    </div>
  );
}
