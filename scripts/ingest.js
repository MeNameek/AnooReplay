// Fresh ingest — no reuse of old scripts.
// Reads C:\Users\minec\Downloads\Dataset_NQ_1min_2022_2025.csv (ET timestamps)
// Converts ET -> UTC unix, chunks by UTC date, writes public/data/NQ/{YYYY-MM-DD}.json + dates.json
// Also writes aggregated monthly files for fast initial load if needed.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = 'C:\\Users\\minec\\Downloads\\Dataset_NQ_1min_2022_2025.csv'
const OUT_ROOT = path.join(__dirname, '..', 'public', 'data', 'NQ')

function isDST(year, month, day) {
  // DST: 2nd Sunday March 02:00 -> 1st Sunday Nov 02:00
  const marchSundays = []
  for (let d = 1; d <= 31; d++) if (new Date(Date.UTC(year, 2, d)).getUTCDay() === 0) marchSundays.push(d)
  const dstStart = marchSundays[1]
  const novSundays = []
  for (let d = 1; d <= 30; d++) if (new Date(Date.UTC(year, 10, d)).getUTCDay() === 0) novSundays.push(d)
  const dstEnd = novSundays[0]
  // month is 1-12
  if (month < 3 || month > 11) return false
  if (month > 3 && month < 11) return true
  if (month === 3) return day >= dstStart
  if (month === 11) return day < dstEnd
  return false
}

function parseETtoUTC(etStr) {
  // "12/26/2022 18:01"
  const [datePart, timePart] = etStr.split(' ')
  const [m, d, y] = datePart.split('/').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  const offset = isDST(y, m, d) ? -4 : -5 // ET = UTC-4/-5
  const utcHours = hh - offset
  const dt = new Date(Date.UTC(y, m - 1, d, utcHours, mm, 0))
  return Math.floor(dt.getTime() / 1000)
}

console.log('Reading', INPUT)
const raw = fs.readFileSync(INPUT, 'utf-8')
const lines = raw.trim().split('\n')
console.log('lines', lines.length, 'header', lines[0])

const byDate = {}
const all = []
let errors = 0

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue
  const comma = line.indexOf(',')
  const et = line.slice(0, comma)
  const rest = line.slice(comma + 1).split(',')
  if (rest.length < 5) { errors++; continue }
  try {
    const time = parseETtoUTC(et)
    const open = parseFloat(rest[0])
    const high = parseFloat(rest[1])
    const low = parseFloat(rest[2])
    const close = parseFloat(rest[3])
    const volume = parseInt(rest[4]) || 0
    if (!isFinite(time) || !isFinite(open)) { errors++; continue }
    const bar = { time, open, high, low, close, volume }
    all.push(bar)
    const key = new Date(time * 1000).toISOString().slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(bar)
  } catch { errors++ }
}

console.log(`parsed ${all.length} bars, errors ${errors}`)
console.log(`range ${new Date(all[0].time*1000).toISOString()} -> ${new Date(all[all.length-1].time*1000).toISOString()}`)
console.log(`unique days ${Object.keys(byDate).length}`)

fs.mkdirSync(OUT_ROOT, { recursive: true })
const dates = Object.keys(byDate).sort()
for (const d of dates) {
  // ensure sorted by time
  byDate[d].sort((a,b)=>a.time-b.time)
  // lightweight-charts expects array of [time,open,high,low,close,volume] to keep size small
  // we store as [time,o,h,l,c,v] tuples
  const tuples = byDate[d].map(b=>[b.time,b.open,b.high,b.low,b.close,b.volume])
  fs.writeFileSync(path.join(OUT_ROOT, d+'.json'), JSON.stringify(tuples))
}
fs.writeFileSync(path.join(OUT_ROOT, 'dates.json'), JSON.stringify(dates))
console.log(`wrote ${dates.length} daily files to ${OUT_ROOT}`)
console.log('done')
