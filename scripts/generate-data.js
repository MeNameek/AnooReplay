const fs = require('fs');
const path = require('path');

const CONTRACTS = {
  NQ: {
    name: 'E-mini NASDAQ 100',
    tickSize: 0.25,
    tickValue: 5,
    basePrice: 18000,
    volatility: 0.0008,
    sessionHours: { start: 18, end: 17 }, // 6pm-5pm ET (next day)
  },
  ES: {
    name: 'E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 5,
    basePrice: 5200,
    volatility: 0.0005,
    sessionHours: { start: 18, end: 17 },
  },
  MNQ: {
    name: 'Micro E-mini NASDAQ 100',
    tickSize: 0.25,
    tickValue: 0.5,
    basePrice: 18000,
    volatility: 0.0008,
    sessionHours: { start: 18, end: 17 },
  },
  MES: {
    name: 'Micro E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 0.5,
    basePrice: 5200,
    volatility: 0.0005,
    sessionHours: { start: 18, end: 17 },
  },
};

function isTradingDay(date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function isTradingHour(date) {
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const etHour = (h - 4 + 24) % 24; // rough ET conversion

  // Sunday 6pm ET to Friday 5pm ET
  const day = date.getUTCDay();
  if (day === 0 && etHour >= 18) return true;
  if (day >= 1 && day <= 4) return true;
  if (day === 5 && etHour < 17) return true;
  if (day === 0 && etHour < 18) return false;
  return false;
}

function getVolumeMultiplier(date) {
  const h = date.getUTCHours();
  const etHour = (h - 4 + 24) % 24;

  // Higher volume at open/close, lunch lull
  if (etHour >= 9 && etHour < 10) return 2.0;    // morning rush
  if (etHour >= 10 && etHour < 12) return 1.2;
  if (etHour >= 12 && etHour < 14) return 0.7;   // lunch
  if (etHour >= 14 && etHour < 16) return 1.5;   // afternoon
  if (etHour >= 16 && etHour < 17) return 1.8;   // close
  if (etHour >= 17 && etHour < 18) return 0.5;   // after hours
  if (etHour >= 18 || etHour < 6) return 0.3;    // overnight
  if (etHour >= 6 && etHour < 9) return 0.8;     // pre-market
  return 1.0;
}

function generateDayBars(contract, date, prevClose) {
  const spec = CONTRACTS[contract];
  const bars = [];
  let price = prevClose || spec.basePrice;

  // Generate 1-minute bars for the trading session
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 18, 0, 0));
  // Trading ends at 17:00 ET next day = 21:00 UTC
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 21, 0, 0));

  let current = new Date(start);

  while (current < end) {
    if (!isTradingHour(current)) {
      current = new Date(current.getTime() + 60000);
      continue;
    }

    const volMult = getVolumeMultiplier(current);

    // Random walk with mean reversion
    const drift = (spec.basePrice - price) * 0.0001; // mean reversion
    const noise = (Math.random() - 0.5) * 2 * spec.volatility * price;
    const move = drift + noise;

    const open = Math.round(price / spec.tickSize) * spec.tickSize;
    const closeRaw = price + move;
    const close = Math.round(closeRaw / spec.tickSize) * spec.tickSize;

    const highRaw = Math.max(open, close) + Math.random() * Math.abs(move) * 2;
    const lowRaw = Math.min(open, close) - Math.random() * Math.abs(move) * 2;
    const high = Math.round(highRaw / spec.tickSize) * spec.tickSize;
    const low = Math.round(lowRaw / spec.tickSize) * spec.tickSize;

    const volume = Math.floor((50 + Math.random() * 200) * volMult);

    bars.push({
      time: Math.floor(current.getTime() / 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
    current = new Date(current.getTime() + 60000);
  }

  return { bars, lastClose: price };
}

function generateYear(contract, year) {
  const spec = CONTRACTS[contract];
  const allBars = [];
  let price = spec.basePrice;

  // Start from beginning of year
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));

  let current = new Date(startDate);

  while (current <= endDate) {
    if (isTradingDay(current) || (current.getUTCDay() === 0)) {
      const { bars, lastClose } = generateDayBars(contract, current, price);
      allBars.push(...bars);
      price = lastClose;
    }
    current = new Date(current.getTime() + 86400000);
  }

  return allBars;
}

// Generate data
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const [symbol, spec] of Object.entries(CONTRACTS)) {
  console.log(`Generating data for ${symbol} (${spec.name})...`);

  const bars2024 = generateYear(symbol, 2024);
  const bars2025 = generateYear(symbol, 2025);
  const allBars = [...bars2024, ...bars2025];

  // Write full dataset
  const filePath = path.join(OUTPUT_DIR, `${symbol}.json`);
  fs.writeFileSync(filePath, JSON.stringify(allBars));
  console.log(`  ${allBars.length} bars written to ${filePath}`);

  // Write by date for efficient loading
  const dateDir = path.join(OUTPUT_DIR, symbol);
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
  }

  const byDate = {};
  for (const bar of allBars) {
    const d = new Date(bar.time * 1000);
    const dateKey = d.toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(bar);
  }

  for (const [dateKey, bars] of Object.entries(byDate)) {
    const datePath = path.join(dateDir, `${dateKey}.json`);
    fs.writeFileSync(datePath, JSON.stringify(bars));
  }

  console.log(`  ${Object.keys(byDate).length} daily files written`);
}

console.log('Done generating data!');
