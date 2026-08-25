const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const symbols = ['NQ', 'ES', 'MNQ', 'MES'];

for (const symbol of symbols) {
  const dateDir = path.join(DATA_DIR, symbol);
  if (!fs.existsSync(dateDir)) continue;

  const files = fs.readdirSync(dateDir).filter(f => f.endsWith('.json'));
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const filePath = path.join(dateDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    totalBefore += Buffer.byteLength(raw);

    const bars = JSON.parse(raw);
    // Compact format: [time, open, high, low, close, volume]
    const compact = bars.map(b => [b.time, b.open, b.high, b.low, b.close, b.volume]);
    const compactStr = JSON.stringify(compact);
    totalAfter += Buffer.byteLength(compactStr);

    fs.writeFileSync(filePath, compactStr);
  }

  console.log(`${symbol}: ${files.length} files, ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
}

console.log('Done compressing!');
