import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = 'C:\\Users\\minec\\Downloads\\nami_databento_data\\MNQ_1m.csv'
const OUT_ROOT = path.join(__dirname, '..', 'public', 'data', 'NQ')

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
  const [timeStr, open, high, low, close, volume] = line.split(',')
  if (!timeStr || !open) { errors++; continue }
  try {
    const time = Math.floor(new Date(timeStr).getTime() / 1000)
    const o = parseFloat(open)
    const h = parseFloat(high)
    const l = parseFloat(low)
    const c = parseFloat(close)
    const v = parseInt(volume) || 0
    if (!isFinite(time) || !isFinite(o)) { errors++; continue }
    const bar = { time, open: o, high: h, low: l, close: c, volume: v }
    all.push(bar)
    const key = new Date(time * 1000).toISOString().slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(bar)
  } catch { errors++ }
}

console.log(`parsed ${all.length} bars, errors ${errors}`)
console.log(`range ${new Date(all[0].time*1000).toISOString()} -> ${new Date(all[all.length-1].time*1000).toISOString()}`)
console.log(`unique days ${Object.keys(byDate).length}`)

fs.rmSync(OUT_ROOT, { recursive: true, force: true })
fs.mkdirSync(OUT_ROOT, { recursive: true })
const dates = Object.keys(byDate).sort()
for (const d of dates) {
  byDate[d].sort((a,b)=>a.time-b.time)
  const tuples = byDate[d].map(b=>[b.time,b.open,b.high,b.low,b.close,b.volume])
  fs.writeFileSync(path.join(OUT_ROOT, d+'.json'), JSON.stringify(tuples))
}
fs.writeFileSync(path.join(OUT_ROOT, 'dates.json'), JSON.stringify(dates))
console.log(`wrote ${dates.length} daily files to ${OUT_ROOT}`)
console.log('done')
