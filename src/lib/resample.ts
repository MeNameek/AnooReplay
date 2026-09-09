// Resample 1m bars to any timeframe.
// Nami dropdown: 1m 2m 3m 5m 10m 15m 30m 45m / 1H 2H 4H / 1D
// We bucket by unix seconds: floor(time / tf) * tf

export type Bar = { time: number; open: number; high: number; low: number; close: number; volume: number }

export function resample(bars: Bar[], tfSeconds: number): Bar[] {
  if (tfSeconds === 60) return bars
  const out: Bar[] = []
  let cur: Bar | null = null
  for (const b of bars) {
    const bucket = Math.floor(b.time / tfSeconds) * tfSeconds
    if (!cur || cur.time !== bucket) {
      if (cur) out.push(cur)
      cur = { time: bucket, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume }
    } else {
      cur.high = Math.max(cur.high, b.high)
      cur.low = Math.min(cur.low, b.low)
      cur.close = b.close
      cur.volume += b.volume
    }
  }
  if (cur) out.push(cur)
  return out
}

export const TIMEFRAMES = [
  { label: '1m', s: 60 },
  { label: '2m', s: 120 },
  { label: '3m', s: 180 },
  { label: '5m', s: 300 },
  { label: '10m', s: 600 },
  { label: '15m', s: 900 },
  { label: '30m', s: 1800 },
  { label: '45m', s: 2700 },
  { label: '1H', s: 3600 },
  { label: '2H', s: 7200 },
  { label: '4H', s: 14400 },
  { label: '1D', s: 86400 },
  { label: '1W', s: 604800 },
  { label: '1M', s: 2592000 },
] as const
