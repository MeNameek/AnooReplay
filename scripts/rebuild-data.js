const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const symbols = ['NQ', 'ES', 'MNQ', 'MES'];

// Re-read from the original NQ data and re-derive only 2024-2025
const NQ_FULL = path.join(DATA_DIR, 'NQ_full.json');

// Check if we have the original uncompressed NQ
if (!fs.existsSync(NQ_FULL)) {
  console.log('No NQ_full.json found. Need to re-download or re-generate.');
  process.exit(1);
}

const allBars = JSON.parse(fs.readFileSync(NQ_FULL, 'utf-8'));

// Filter to 2024-2025 only
const cutoff = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000);
const filtered = allBars.filter(b => b.time >= cutoff);
console.log(`Filtered ${allBars.length} -> ${filtered.length} bars (2024-2025)`);

const contracts = {
  NQ: { scale: 1 },
  ES: { scale: 5200 / 18000 },
  MNQ: { scale: 1 },
  MES: { scale: 5200 / 18000 },
};

for (const [symbol, cfg] of Object.entries(contracts)) {
  console.log(`Processing ${symbol}...`);

  // Clean old files
  const dateDir = path.join(DATA_DIR, symbol);
  if (fs.existsSync(dateDir)) {
    fs.rmSync(dateDir, { recursive: true });
  }
  fs.mkdirSync(dateDir, { recursive: true });

  // Remove old full file
  const fullPath = path.join(DATA_DIR, `${symbol}.json`);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

  // Transform bars
  const bars = filtered.map(b => ({
    time: b.time,
    open: parseFloat((b.open * cfg.scale).toFixed(2)),
    high: parseFloat((b.high * cfg.scale).toFixed(2)),
    low: parseFloat((b.low * cfg.scale).toFixed(2)),
    close: parseFloat((b.close * cfg.scale).toFixed(2)),
    volume: b.volume,
  }));

  // Write per-date compact: [[time,open,high,low,close,vol], ...]
  const byDate = {};
  for (const bar of bars) {
    const d = new Date(bar.time * 1000);
    const key = d.toISOString().split('T')[0];
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push([bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume]);
  }

  let totalBytes = 0;
  for (const [dateKey, arr] of Object.entries(byDate)) {
    const str = JSON.stringify(arr);
    totalBytes += Buffer.byteLength(str);
    fs.writeFileSync(path.join(dateDir, `${dateKey}.json`), str);
  }

  console.log(`  ${Object.keys(byDate).length} days, ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
}

console.log('Done!');
