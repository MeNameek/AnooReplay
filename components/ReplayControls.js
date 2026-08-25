export default function ReplayControls({
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBack,
  onSkipToStart,
  onSkipToEnd,
  onReset,
  speed,
  onSpeedChange,
  currentIndex,
  totalBars,
  onSeek,
  currentTime,
}) {
  const progress = totalBars > 0 ? (currentIndex / (totalBars - 1)) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const targetIndex = Math.floor(pct * (totalBars - 1));
    onSeek(Math.max(0, Math.min(totalBars - 1, targetIndex)));
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    const d = new Date(time * 1000);
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${d.getUTCFullYear()}-${month}-${day} ${hours}:${mins}`;
  };

  return (
    <div className="replay-bar">
      <button className="replay-btn" onClick={onReset} title="Reset">
        ⏮
      </button>

      <button className="replay-btn" onClick={onStepBack} title="Step Back">
        ◀◀
      </button>

      <button
        className={`replay-btn ${isPlaying ? 'playing' : ''}`}
        onClick={onPlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button className="replay-btn" onClick={onStepForward} title="Step Forward">
        ▶▶
      </button>

      <button className="replay-btn" onClick={onSkipToEnd} title="Skip to End">
        ⏭
      </button>

      <div className="replay-progress" onClick={handleProgressClick}>
        <div className="replay-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="replay-speed">
        <span className="replay-speed-label">{speed}x</span>
        {[1, 2, 5, 10, 25, 50].map(s => (
          <button
            key={s}
            className={`speed-btn ${speed === s ? 'active' : ''}`}
            onClick={() => onSpeedChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="replay-time">
        {formatTime(currentTime)} ({currentIndex + 1}/{totalBars})
      </div>
    </div>
  );
}
