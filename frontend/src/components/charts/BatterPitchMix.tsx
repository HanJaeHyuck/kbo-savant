import React from 'react'
import type { BatterArsenalRow } from '../../types'

const PT_COLOR: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777', 기타: '#9CA3AF',
}
const color = (t: string) => PT_COLOR[t] ?? '#94A3B8'
const d3 = (v: number) => v.toFixed(3).replace(/^0/, '')

/* 구종별 상대 성적 — 투수 페이지의 '구종 구성'에 대응하는 타자 버전 */
const BatterPitchMix = React.memo(function BatterPitchMix({ rows }: { rows: BatterArsenalRow[] }) {
  if (!rows || rows.length === 0) {
    return <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]">데이터가 없습니다.</div>
  }
  const maxBa = Math.max(...rows.map(r => r.ba), 0.001)

  return (
    <div className="space-y-2.5" data-testid="batter-pitch-mix">
      {rows.map(r => (
        <div key={r.pitch_type} data-testid="batter-pitch-mix-row">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: color(r.pitch_type) }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color(r.pitch_type) }} />
              {r.pitch_type}
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
              {r.bbe}타구 ({r.pct.toFixed(1)}%) · BA {d3(r.ba)}
            </span>
          </div>
          {/* 타율을 바 길이로 (구종 상대 성적 비교) */}
          <div className="h-3 bg-gray-100 rounded overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(r.ba / maxBa) * 100}%`, backgroundColor: color(r.pitch_type), minWidth: 4 }} />
          </div>
        </div>
      ))}
      <p className="text-[9px] text-[var(--color-text-muted)]">바 길이 = 구종별 타율(최고값 기준) · 인플레이 타구</p>
    </div>
  )
})

export default BatterPitchMix
