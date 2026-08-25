export const CONTRACTS = {
  NQ: {
    name: 'E-mini NASDAQ 100',
    tickSize: 0.25,
    tickValue: 5,
    basePrice: 18000,
    color: '#2196F3',
  },
  ES: {
    name: 'E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 5,
    basePrice: 5200,
    color: '#4CAF50',
  },
  MNQ: {
    name: 'Micro NASDAQ 100',
    tickSize: 0.25,
    tickValue: 0.5,
    basePrice: 18000,
    color: '#FF9800',
  },
  MES: {
    name: 'Micro S&P 500',
    tickSize: 0.25,
    tickValue: 0.5,
    basePrice: 5200,
    color: '#9C27B0',
  },
};

export const TIMEFRAMES = [
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1H', seconds: 3600 },
  { label: '4H', seconds: 14400 },
  { label: 'D', seconds: 86400 },
];

export const SPEEDS = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '5x', value: 5 },
  { label: '10x', value: 10 },
  { label: '25x', value: 25 },
  { label: '50x', value: 50 },
];
