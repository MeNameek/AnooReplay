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
  upColor: '#F0EFEC',
  downColor: '#2B2B2B',
  upBorder: '#000000',
  downBorder: '#000000',
  upWick: '#000000',
  downWick: '#000000',
  showVolume: true,
  upVolume: '#D6D4C8',
  downVolume: '#9A9996',
  background: '#E8E6D6',
  showGrid: true,
  gridColor: '#DDDCCF',
  sessionBreaks: true,
  sessionZones: false,
  executionMarks: true,
  watermark: true,
  crosshairStyle: 'dotted',
  crosshairColor: '#8A8986',
  crosshairCursor: true,
  lockCrosshair: false,
  axisTextColor: '#6B6B6B',
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
