export type ToolDef = { id: string; label: string; group: string; starredDefault?: boolean }
export type ToolGroup = { id: string; label: string; icon: string; tools: ToolDef[] }

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'lines',
    label: 'Lines',
    icon: 'M6 20 L18 4',
    tools: [
      { id: 'trendline', label: 'Trendline', group: 'lines' },
      { id: 'ray', label: 'Ray', group: 'lines' },
      { id: 'infoLine', label: 'Info Line', group: 'lines' },
      { id: 'extended', label: 'Extended Line', group: 'lines' },
      { id: 'trendAngle', label: 'Trend Angle', group: 'lines' },
      { id: 'hline', label: 'Horizontal Line', group: 'lines' },
      { id: 'hRay', label: 'Horizontal Ray', group: 'lines', starredDefault: true },
      { id: 'vline', label: 'Vertical Line', group: 'lines' },
    ],
  },
  {
    id: 'channels',
    label: 'Channels',
    icon: 'M4 6 L20 14 M4 14 L20 22',
    tools: [
      { id: 'parallelChannel', label: 'Parallel Channel', group: 'channels' },
      { id: 'regressionTrend', label: 'Regression Trend', group: 'channels' },
      { id: 'flatTopBottom', label: 'Flat Top/Bottom', group: 'channels' },
    ],
  },
  {
    id: 'fib',
    label: 'Fibonacci',
    icon: 'M4 4 H20 M4 10 H20 M4 16 H20',
    tools: [
      { id: 'fib', label: 'Fib Retracement', group: 'fib', starredDefault: true },
      { id: 'fibExtension', label: 'Trend-Based Fib Extension', group: 'fib' },
      { id: 'fibChannel', label: 'Fib Channel', group: 'fib' },
      { id: 'fibTimeZone', label: 'Fib Time Zone', group: 'fib' },
      { id: 'fibSpeedFan', label: 'Fib Speed Resistance Fan', group: 'fib' },
      { id: 'fibTrendTime', label: 'Trend-Based Fib Time', group: 'fib' },
      { id: 'fibCircles', label: 'Fib Circles', group: 'fib' },
      { id: 'fibSpiral', label: 'Fib Spiral', group: 'fib' },
      { id: 'fibArcs', label: 'Fib Speed Resistance Arcs', group: 'fib' },
      { id: 'fibWedge', label: 'Fib Wedge', group: 'fib' },
      { id: 'pitchfan', label: 'Pitchfan', group: 'fib' },
    ],
  },
  {
    id: 'patterns',
    label: 'Chart Patterns',
    icon: 'M4 14 L8 6 L12 14 L16 7 L20 14',
    tools: [
      { id: 'xabcd', label: 'XABCD Pattern', group: 'patterns' },
      { id: 'cypher', label: 'Cypher Pattern', group: 'patterns' },
      { id: 'headShoulders', label: 'Head and Shoulders', group: 'patterns' },
      { id: 'abcd', label: 'ABCD Pattern', group: 'patterns' },
      { id: 'trianglePattern', label: 'Triangle Pattern', group: 'patterns' },
      { id: 'threeDrives', label: 'Three Drives Pattern', group: 'patterns' },
    ],
  },
  {
    id: 'elliott',
    label: 'Elliott Waves',
    icon: 'M4 16 L8 8 L12 16 L16 4 L20 12',
    tools: [
      { id: 'elliottImpulse', label: 'Elliott Impulse Wave (1-2-3-4-5)', group: 'elliott' },
      { id: 'elliottCorrection', label: 'Elliott Correction Wave (A-B-C)', group: 'elliott' },
      { id: 'elliottTriangle', label: 'Elliott Triangle Wave (A-B-C-D-E)', group: 'elliott' },
      { id: 'elliottDouble', label: 'Elliott Double Combo Wave (W-X-Y)', group: 'elliott' },
      { id: 'elliottTriple', label: 'Elliott Triple Combo Wave (W-X-Y-Z)', group: 'elliott' },
    ],
  },
  {
    id: 'forecast',
    label: 'Forecasting',
    icon: 'M12 4 V16 M8 8 H16',
    tools: [
      { id: 'long', label: 'Long Position', group: 'forecast', starredDefault: true },
      { id: 'short', label: 'Short Position', group: 'forecast', starredDefault: true },
      { id: 'positionForecast', label: 'Position Forecast', group: 'forecast' },
      { id: 'barsPattern', label: 'Bars Pattern', group: 'forecast' },
      { id: 'ghostFeed', label: 'Ghost Feed', group: 'forecast' },
      { id: 'sector', label: 'Sector', group: 'forecast' },
    ],
  },
  {
    id: 'volume',
    label: 'Volume-Based',
    icon: 'M6 4 H12 V14 H6 Z M14 8 H18 V18 H14 Z',
    tools: [
      { id: 'anchoredVwap', label: 'Anchored VWAP', group: 'volume' },
      { id: 'fixedRangeVP', label: 'Fixed Range Volume Profile', group: 'volume' },
      { id: 'anchoredVP', label: 'Anchored Volume Profile', group: 'volume' },
    ],
  },
  {
    id: 'measurers',
    label: 'Measurers',
    icon: 'M5 12 H19 M12 5 V19',
    tools: [
      { id: 'priceRange', label: 'Price Range', group: 'measurers', starredDefault: true },
      { id: 'dateRange', label: 'Date Range', group: 'measurers' },
      { id: 'datePriceRange', label: 'Date and Price Range', group: 'measurers' },
    ],
  },
  {
    id: 'shapes',
    label: 'Shapes',
    icon: 'M6 6 H18 V18 H6 Z',
    tools: [
      { id: 'rect', label: 'Rectangle', group: 'shapes', starredDefault: true },
      { id: 'rotatedRect', label: 'Rotated Rectangle', group: 'shapes' },
      { id: 'path', label: 'Path', group: 'shapes' },
      { id: 'circle', label: 'Circle', group: 'shapes' },
      { id: 'ellipse', label: 'Ellipse', group: 'shapes' },
      { id: 'polyline', label: 'Polyline', group: 'shapes' },
      { id: 'triangle', label: 'Triangle', group: 'shapes' },
      { id: 'arc', label: 'Arc', group: 'shapes' },
      { id: 'curve', label: 'Curve', group: 'shapes' },
      { id: 'doubleCurve', label: 'Double Curve', group: 'shapes' },
    ],
  },
  {
    id: 'text',
    label: 'Text and Notes',
    icon: 'M7 4 H17 M12 4 V20',
    tools: [
      { id: 'text', label: 'Text', group: 'text' },
      { id: 'note', label: 'Note', group: 'text' },
      { id: 'priceNote', label: 'Price Note', group: 'text' },
      { id: 'pin', label: 'Pin', group: 'text' },
      { id: 'table', label: 'Table', group: 'text' },
      { id: 'callout', label: 'Callout', group: 'text' },
      { id: 'comment', label: 'Comment', group: 'text' },
      { id: 'priceLabel', label: 'Price Label', group: 'text' },
      { id: 'signpost', label: 'Signpost', group: 'text' },
      { id: 'flag', label: 'Flag Mark', group: 'text' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'M6 6 H18 V17 H6 Z M8 8 H12',
    tools: [
      { id: 'image', label: 'Image', group: 'content' },
      { id: 'post', label: 'Post', group: 'content' },
      { id: 'idea', label: 'Idea', group: 'content' },
    ],
  },
]

export const ALL_TOOLS: ToolDef[] = TOOL_GROUPS.flatMap(g => g.tools)

export function defaultFavorites(): string[] {
  return ALL_TOOLS.filter(t => t.starredDefault).map(t => t.id)
}
