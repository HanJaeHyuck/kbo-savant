import React from 'react'
import type { PitchCountBreakdownProps } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A',
  포심: '#1E3A8A',
  슬라이더: '#0F6E56',
  체인지업: '#BA7517',
  커브: '#7C3AED',
  커터: '#0EA5E9',
  싱커: '#65A30D',
  스플리터: '#DB2777',
}
const color = (pt: string) => PITCH_COLORS[pt] ?? '#9CA3AF'

const PitchCountBreakdown = React.memo(function PitchCountBreakdown({ data }: PitchCountBreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]" data-testid="pitch-count-empty">
        데이터가 없습니다.
      </div>
    )
  }

  const allTypes = Array.from(new Set(data.flatMap(r => r.breakdown.map(b => b.pitch_type))))

  return (
    <div data-testid="pitch-count-breakdown">
      <div className="space-y-2">
        {data.map(row => (
          <div key={row.count} className="flex items-center gap-2">
            <span className="w-10 text-xs font-mono text-[var(--color-text-secondary)] text-right">{row.count}</span>
            <div className="flex-1 flex h-4 rounded overflow-hidden bg-[#F1F5F9]">
              {row.breakdown.map(b => (
                <div
                  key={b.pitch_type}
                  style={{ width: `${b.pct}%`, background: color(b.pitch_type) }}
                  title={`${b.pitch_type} ${b.pct}%`}
                />
              ))}
            </div>
            <span className="w-8 text-[10px] text-[var(--color-text-muted)] text-right">{row.pitches}</span>
          </div>
        ))}
      </div>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
        {allTypes.map(t => (
          <span key={t} className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color(t) }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
})

export default PitchCountBreakdown
