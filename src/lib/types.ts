export type Bar = { time: number; open: number; high: number; low: number; close: number; volume: number }

export type Drawing =
  | { id: string; type: 'hline'; price: number; color: string }
  | { id: string; type: 'rect'; top: number; bottom: number; color: string; fill: string }
  | { id: string; type: 'trend'; p1: { time: number; price: number }; p2: { time: number; price: number }; color: string }
  | { id: string; type: 'fib'; p1: { time: number; price: number }; p2: { time: number; price: number } }
  | { id: string; type: 'long'; entry: number; sl: number; tp: number }
  | { id: string; type: 'short'; entry: number; sl: number; tp: number }
