import { getPercentileColor, getPercentileLevel } from '../../utils/percentile'
import type { PercentileBarProps } from '../../types'

export default function PercentileBar({
  label, value, percentile, tooltip, invertColor = false,
}: PercentileBarProps) {
  const displayPercentile = invertColor ? (100 - percentile) : percentile
  const color = getPercentileColor(displayPercentile)
  const level = getPercentileLevel(displayPercentile)

  return (
    <div
      className="grid items-center gap-x-2 py-1"
      style={{ gridTemplateColumns: 'clamp(70px,20%,100px) 1fr clamp(50px,15%,75px)' }}
      title={tooltip}
      data-testid="percentile-bar"
    >
      <span className="text-xs text-[var(--color-text-secondary)] truncate">{label}</span>

      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${percentile}%`, backgroundColor: color }}
          data-percentile-level={level}
        />
      </div>

      <div className="flex items-center gap-1 justify-end">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
          aria-label={`퍼센타일 ${percentile}`}
        >
          {percentile}
        </div>
        <span className="text-xs font-mono text-[var(--color-text-primary)]">{value}</span>
      </div>
    </div>
  )
}
