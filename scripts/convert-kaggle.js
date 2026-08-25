const fs = require('fs');
const path = require('path');

const INPUT = 'C:\\Users\\minec\\Downloads\\Dataset_NQ_1min_2022_2025.csv';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// ET offset rules (approximate DST transitions for 2022-2025)
// DST: 2nd Sunday March 2am -> 1st Sunday Nov 2am
function getETOffset(year, month, day) {
  // DST start: 2nd Sunday of March
  const marchSundays = [];
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(Date.UTC(year, 2, d));
    if (dt.getUTCDay() === 0) marchSundays.push(d);
  }
  const dstStart = marchSundays[1]; // 2nd Sunday

  // DST end: 1st Sunday of November
  const novSundays = [];
  for (let d = 1; d <= 30; d++) {
    const dt = new Date(Date.UTC(year, 10, d));
    if (dt.getUTCDay() === 0) novSundays.push(d);
  }
  const dstEnd = novSundays[0]; // 1st Sunday

  const monthNum = month; // 0-indexed? no, we'll pass 1-indexed
  const isDST =
    (monthNum > 3 || (monthNum === 3 && day >= dstStart)) &&
    (monthNum < 11 || (monthNum === 11 && day < dstEnd));

  return isDST ? -4 : -5; // EDT = UTC-4, EST = UTC-5
}

function parseETToUTC(dateStr) {
  // Format: "12/26/2022 18:01"
  const [datePart, timePart] = dateStr.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const utcOffset = getETOffset(year, month, day);

  // Convert ET to UTC
  const utcHours = hours - utcOffset;
  const utcDate = new Date(Date.UTC(year, month - 1, day, utcHours, minutes, 0));

  return Math.floor(utcDate.getTime() / 1000);
}

console.log('Reading CSV...');
const csv = fs.readFileSync(INPUT, 'utf-8');
const lines = csv.trim().split('\n');
console.log(`Total lines: ${lines.length}`);

// Skip header
const header = lines[0];
console.log(`Header: ${header}`);

const allBars = [];
const byDate = {};

let parseErrors = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Split carefully - timestamp has comma inside
  const firstComma = line.indexOf(',');
  const timestamp = line.substring(0, firstComma);
  const rest = line.substring(firstComma + 1).split(',');

  if (rest.length < 4) {
    parseErrors++;
    continue;
  }

  try {
    const time = parseETToUTC(timestamp);
    const open = parseFloat(rest[0]);
    const high = parseFloat(rest[1]);
    const low = parseFloat(rest[2]);
    const close = parseFloat(rest[3]);
    const volume = parseInt(rest[4]) || 0;

    const bar = { time, open, high, low, close, volume };
    allBars.push(bar);

    const d = new Date(time * 1000);
    const dateKey = d.toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(bar);
  } catch (e) {
    parseErrors++;
  }
}

console.log(`Parsed ${allBars.length} bars, ${parseErrors} errors`);
console.log(`Date range: ${new Date(allBars[0].time * 1000).toISOString()} to ${new Date(allBars[allBars.length - 1].time * 1000).toISOString()}`);

// Write full NQ.json
const nqPath = path.join(OUTPUT_DIR, 'NQ.json');
fs.writeFileSync(nqPath, JSON.stringify(allBars));
console.log(`Wrote ${nqPath} (${(fs.statSync(nqPath).size / 1024 / 1024).toFixed(1)} MB)`);

// Write per-date files
const nqDateDir = path.join(OUTPUT_DIR, 'NQ');
if (!fs.existsSync(nqDateDir)) {
  fs.mkdirSync(nqDateDir, { recursive: true });
}

const dates = Object.keys(byDate).sort();
for (const dateKey of dates) {
  const datePath = path.join(nqDateDir, `${dateKey}.json`);
  fs.writeFileSync(datePath, JSON.stringify(byDate[dateKey]));
}

console.log(`Wrote ${dates.length} daily files to ${nqDateDir}`);
console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
console.log('Done!');
