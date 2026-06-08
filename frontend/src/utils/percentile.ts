export type PercentileLevel = 'red' | 'orange' | 'gray' | 'sky' | 'blue'

export const PERCENTILE_COLORS: Record<PercentileLevel, string> = {
  red:    '#C0392B',
  orange: '#E67E22',
  gray:   '#95A5A6',
  sky:    '#3498DB',
  blue:   '#1E3A8A',
}

export function getPercentileLevel(percentile: number): PercentileLevel {
  if (percentile >= 90) return 'red'
  if (percentile >= 75) return 'orange'
  if (percentile >= 40) return 'gray'
  if (percentile >= 25) return 'sky'
  return 'blue'
}

export function getPercentileColor(percentile: number): string {
  return PERCENTILE_COLORS[getPercentileLevel(percentile)]
}
