export type ChartSettings = {
  // Symbol — matches Nami Settings > Symbol
  upColor: string
  downColor: string
  upBorder: string
  downBorder: string
  upWick: string
  downWick: string
  showVolume: boolean
  upVolume: string
  downVolume: string
  // Appearance
  background: string
  showGrid: boolean
  gridColor: string
  sessionBreaks: boolean
  sessionZones: boolean
  executionMarks: boolean
  watermark: boolean
  crosshairStyle: 'dotted' | 'solid' | 'dashed'
  crosshairColor: string
  crosshairCursor: boolean
  lockCrosshair: boolean
  axisTextColor: string
  fontSize: number
  // Scales
  priceScalePosition: 'right' | 'left' | 'none'
  scaleMode: 'normal' | 'log'
  autoScale: boolean
  showTime: boolean
  showSeconds: boolean
  timezone: string
  showOHLC: boolean
  showBarChange: boolean
  detachableToolbars: boolean
  syncCompared: boolean
  chartInertia: number // 0-100
  performanceMode: boolean
  // Replay
  startTime: string // e.g. "9:30 AM"
  scrollWithNewest: boolean
}

export const DEFAULT_SETTINGS: ChartSettings = {
  upColor: '#A3A3A3',
  downColor: '#454545',
  upBorder: '#000000',
  downBorder: '#000000',
  upWick: '#000000',
  downWick: '#000000',
  showVolume: true,
  upVolume: '#C8C8C8',
  downVolume: '#8A8A8A',
  background: '#0a0a0a',
  showGrid: true,
  gridColor: '#1a1a1a',
  sessionBreaks: true,
  sessionZones: false,
  executionMarks: true,
  watermark: true,
  crosshairStyle: 'dotted',
  crosshairColor: '#000000',
  crosshairCursor: true,
  lockCrosshair: false,
  axisTextColor: '#999999',
  fontSize: 11,
  priceScalePosition: 'right',
  scaleMode: 'normal',
  autoScale: true,
  showTime: true,
  showSeconds: false,
  timezone: 'Eastern (ET)',
  showOHLC: true,
  showBarChange: true,
  detachableToolbars: true,
  syncCompared: true,
  chartInertia: 60,
  performanceMode: false,
  startTime: '9:30 AM',
  scrollWithNewest: true,
}
