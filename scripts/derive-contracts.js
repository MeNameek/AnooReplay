const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// Read real NQ data
const nqBars = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'NQ.json'), 'utf-8'));
console.log(`NQ bars: ${nqBars.length}`);

// Derive ES, MNQ, MES from NQ by scaling price level
// ES ~= NQ * 0.29 (approx ratio), tick size 0.25, tick value $50
// MNQ = NQ (same price), tick size 0.25, tick value $0.50
// MES ~= ES price, tick size 0.25, tick value $0.50

const contracts = {
  ES: {
    scaleFactor: 5200 / 18000,  // Scale NQ base ~18000 to ES base ~5200
    basePrice: 5200,
  },
  MNQ: {
    scaleFactor: 1,  // Same price as NQ
    basePrice: 18000,
  },
  MES: {
    scaleFactor: 5200 / 18000,  // Same as ES
    basePrice: 5200,
  },
};

for (const [symbol, config] of Object.entries(contracts)) {
  console.log(`Generating ${symbol}...`);

  const bars = nqBars.map(bar => ({
    time: bar.time,
    open: parseFloat((bar.open * config.scaleFactor).toFixed(2)),
    high: parseFloat((bar.high * config.scaleFactor).toFixed(2)),
    low: parseFloat((bar.low * config.scaleFactor).toFixed(2)),
    close: parseFloat((bar.close * config.scaleFactor).toFixed(2)),
    volume: bar.volume,
  }));

  // Write full file
  const filePath = path.join(OUTPUT_DIR, `${symbol}.json`);
  fs.writeFileSync(filePath, JSON.stringify(bars));
  console.log(`  Wrote ${filePath} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(1)} MB)`);

  // Write per-date files
  const dateDir = path.join(OUTPUT_DIR, symbol);
  if (!fs.existsSync(dateDir)) fs.mkdirSync(dateDir, { recursive: true });

  const byDate = {};
  for (const bar of bars) {
    const d = new Date(bar.time * 1000);
    const dateKey = d.toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(bar);
  }

  for (const [dateKey, dateBars] of Object.entries(byDate)) {
    fs.writeFileSync(path.join(dateDir, `${dateKey}.json`), JSON.stringify(dateBars));
  }
  console.log(`  Wrote ${Object.keys(byDate).length} daily files`);
}

console.log('Done!');
