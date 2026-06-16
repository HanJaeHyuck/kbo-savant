import React from 'react'
import type { PitchMixProps } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 커브: '#7C3AED',
  체인지업: '#BA7517', 커터: '#2563EB', 싱커: '#0891B2', 스플리터: '#DC2626',
}
const getPitchColor = (t: string) => PITCH_COLORS[t] ?? '#94A3B8'

const PitchMix = React.memo(function PitchMix({ data }: PitchMixProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]">데이터가 없습니다.</div>
  }
  const sorted = [...data].sort((a, b) => b.pct - a.pct)
  return (
    <div className="space-y-2.5" data-testid="pitch-mix">
      {sorted.map(pt => (
        <div key={pt.pitch_type} data-testid="pitch-mix-row">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: getPitchColor(pt.pitch_type) }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: getPitchColor(pt.pitch_type) }} />
              {pt.pitch_type}
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
              {pt.count}구 ({pt.pct.toFixed(1)}%) · {pt.avg_velocity.toFixed(1)}km/h
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded overflow-hidden">
            <div className="h-full rounded" style={{ width: `${pt.pct}%`, backgroundColor: getPitchColor(pt.pitch_type), minWidth: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
})

export default PitchMix
