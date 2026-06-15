import React from 'react'
import type { MovementProfileProps } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777',
}
const color = (pt: string) => PITCH_COLORS[pt] ?? '#9CA3AF'

const W = 250, H = 230, PAD = 22
const X_RANGE = [-28, 28]   // 수평 무브먼트 cm
const Y_RANGE = [-22, 52]   // 유효 수직 무브먼트 cm
const sx = (v: number) => PAD + ((v - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (W - PAD * 2)
const sy = (v: number) => (H - PAD) - ((v - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (H - PAD * 2)

const MovementProfile = React.memo(function MovementProfile({ data }: MovementProfileProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]" data-testid="movement-empty">
        데이터가 없습니다.
      </div>
    )
  }
  const maxPct = Math.max(...data.map(d => d.pct), 1)
  const x0 = sx(0), y0 = sy(0)

  return (
    <div data-testid="movement-profile">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 320 }} className="block mx-auto">
        <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={0.5} />
        <line x1={x0} y1={PAD} x2={x0} y2={H - PAD} stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={PAD} y1={y0} x2={W - PAD} y2={y0} stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 3" />
        <text x={W - PAD} y={y0 - 4} fontSize={8} fill="#94A3B8" textAnchor="end">수평 →</text>
        <text x={x0 + 4} y={PAD + 8} fontSize={8} fill="#94A3B8">↑ 수직</text>
        {data.map(d => {
          const r = 6 + (d.pct / maxPct) * 12
          return (
            <g key={d.pitch_type}>
              <circle cx={sx(d.h_break)} cy={sy(d.v_break)} r={r} fill={color(d.pitch_type)} fillOpacity={0.55} stroke={color(d.pitch_type)} strokeWidth={1} />
              <text x={sx(d.h_break)} y={sy(d.v_break) + 3} fontSize={8} fill="#fff" textAnchor="middle" fontWeight="bold">{d.pitch_type.slice(0, 2)}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
        {data.map(d => (
          <span key={d.pitch_type} className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color(d.pitch_type) }} />
            {d.pitch_type} <span className="font-mono">{d.avg_velocity}</span>
          </span>
        ))}
      </div>
    </div>
  )
})

export default MovementProfile
