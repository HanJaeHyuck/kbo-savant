import React from 'react'
import type { PitchMixProps } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구:    '#1E3A8A',
  포심:    '#1E3A8A',
  슬라이더: '#0F6E56',
  커브:    '#7C3AED',
  체인지업: '#BA7517',
  커터:    '#2563EB',
  싱커:    '#0891B2',
  스플리터: '#DC2626',
}

function getPitchColor(type: string): string {
  return PITCH_COLORS[type] ?? '#94A3B8'
}

const PitchMix = React.memo(function PitchMix({ data }: PitchMixProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]">
        데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid="pitch-mix">
      {data.map(pt => (
        <div key={pt.pitch_type} data-testid="pitch-mix-row">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="font-medium" style={{ color: getPitchColor(pt.pitch_type) }}>
              {pt.pitch_type}
            </span>
            <span className="text-[var(--color-text-secondary)] font-mono">
              {pt.avg_velocity.toFixed(1)} km/h
            </span>
          </div>
          <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded flex items-center pl-2"
              style={{
                width: `${pt.pct}%`,
                backgroundColor: getPitchColor(pt.pitch_type),
                minWidth: 30,
              }}
            >
              <span className="text-white text-[10px] font-bold">{pt.pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

export default PitchMix
