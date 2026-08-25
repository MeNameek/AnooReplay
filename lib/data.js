import { TIMEFRAMES } from './contracts';

export function aggregateBars(bars, timeframeSeconds) {
  if (timeframeSeconds === 60) return bars;

  const aggregated = [];
  let currentBucket = null;

  for (const bar of bars) {
    const bucketTime = Math.floor(bar.time / timeframeSeconds) * timeframeSeconds;

    if (!currentBucket || currentBucket.time !== bucketTime) {
      if (currentBucket) {
        aggregated.push(currentBucket);
      }
      currentBucket = {
        time: bucketTime,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      };
    } else {
      currentBucket.high = Math.max(currentBucket.high, bar.high);
      currentBucket.low = Math.min(currentBucket.low, bar.low);
      currentBucket.close = bar.close;
      currentBucket.volume += bar.volume;
    }
  }

  if (currentBucket) {
    aggregated.push(currentBucket);
  }

  return aggregated;
}

export function getAvailableDates(bars) {
  const dates = new Set();
  for (const bar of bars) {
    const d = new Date(bar.time * 1000);
    dates.add(d.toISOString().split('T')[0]);
  }
  return Array.from(dates).sort();
}

export function getBarsForDate(allBars, dateStr) {
  const dayStart = new Date(dateStr + 'T00:00:00Z').getTime() / 1000;
  const dayEnd = new Date(dateStr + 'T23:59:59Z').getTime() / 1000;
  return allBars.filter(b => b.time >= dayStart && b.time <= dayEnd);
}
