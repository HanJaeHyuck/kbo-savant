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
      style={{ gridTemplateColumns: 'clamp(78px,26%,108px) 1fr 24px clamp(44px,16%,62px)' }}
      title={tooltip}
      data-testid="percentile-bar"
    >
      <span className="text-xs text-[var(--color-text-secondary)] truncate">{label}</span>

      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${displayPercentile}%`, backgroundColor: color }}
          data-percentile-level={level}
          data-testid="percentile-bar-fill"
        />
      </div>

      {/* 퍼센타일 원 — 고정 칸이라 자릿수와 무관하게 위치 일정 */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
        aria-label={`퍼센타일 ${displayPercentile}`}
      >
        {displayPercentile}
      </div>

      {/* 실제 수치 — 고정 칸 우측 정렬 */}
      <span className="text-xs font-mono text-right text-[var(--color-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )
}
