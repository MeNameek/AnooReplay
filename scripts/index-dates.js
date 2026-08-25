const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const symbols = ['NQ', 'ES', 'MNQ', 'MES'];

for (const symbol of symbols) {
  const dateDir = path.join(DATA_DIR, symbol);
  if (!fs.existsSync(dateDir)) continue;

  const dates = fs.readdirSync(dateDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();

  fs.writeFileSync(path.join(dateDir, 'dates.json'), JSON.stringify(dates));
  console.log(`${symbol}: ${dates.length} dates indexed (${dates[0]} to ${dates[dates.length - 1]})`);
}
