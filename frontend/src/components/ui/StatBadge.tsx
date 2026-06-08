import { getPercentileColor, getPercentileLevel } from '../../utils/percentile'

interface StatBadgeProps {
  label: string
  value: number | string
  percentile?: number
  highlight?: boolean
}

export default function StatBadge({ label, value, percentile, highlight = false }: StatBadgeProps) {
  const level = percentile !== undefined ? getPercentileLevel(percentile) : null
  const bg = level
    ? getPercentileColor(percentile!)
    : highlight ? '#C0392B' : '#E8ECF0'
  const fg = level || highlight ? '#fff' : '#0A1E4E'

  return (
    <div
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono"
      data-percentile-level={level ?? undefined}
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="font-sans text-xs opacity-75">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
