import React from 'react'
import type { PitchZoneMapProps } from '../../types'

// 구종별 색상 (CLAUDE.md 명세)
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
const RESULT_COLORS: Record<string, string> = {
  인플레이: '#C0392B',
  헛스윙: '#7C3AED',
  스트라이크: '#E67E22',
  루킹스트라이크: '#E67E22',
  파울: '#F5A623',
  볼: '#3498DB',
}

function colorFor(p: { pitch_type: string; result: string }, colorBy: 'pitch_type' | 'result') {
  if (colorBy === 'result') return RESULT_COLORS[p.result] ?? '#9CA3AF'
  return PITCH_COLORS[p.pitch_type] ?? '#9CA3AF'
}

// 좌표계: plate_x (-0.7~0.7) → 가로, plate_z (0~1.3) → 세로(위가 큰 값)
const W = 220
const H = 260
const PAD = 24
// 스트라이크존 경계 (대략): x ∈ [-0.28, 0.28], z ∈ [0.45, 1.05]
const ZONE = { xMin: -0.28, xMax: 0.28, zMin: 0.45, zMax: 1.05 }
const X_RANGE = [-0.7, 0.7]
const Z_RANGE = [0, 1.3]

const sx = (x: number) =>
  PAD + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (W - PAD * 2)
const sz = (z: number) =>
  H - PAD - ((z - Z_RANGE[0]) / (Z_RANGE[1] - Z_RANGE[0])) * (H - PAD * 2)

const PitchZoneMap = React.memo(function PitchZoneMap({ data, colorBy = 'pitch_type' }: PitchZoneMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]" data-testid="pitch-zone-empty">
        데이터가 없습니다.
      </div>
    )
  }

  const types = Array.from(new Set(data.map(d => (colorBy === 'result' ? d.result : d.pitch_type))))

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 240 }} data-testid="pitch-zone-map">
        {/* 스트라이크존 박스 */}
        <rect
          x={sx(ZONE.xMin)} y={sz(ZONE.zMax)}
          width={sx(ZONE.xMax) - sx(ZONE.xMin)}
          height={sz(ZONE.zMin) - sz(ZONE.zMax)}
          fill="none" stroke="#334155" strokeWidth={1.5}
        />
        {/* 3x3 보조선 */}
        {[1, 2].map(i => {
          const x = ZONE.xMin + ((ZONE.xMax - ZONE.xMin) * i) / 3
          const z = ZONE.zMin + ((ZONE.zMax - ZONE.zMin) * i) / 3
          return (
            <g key={i} stroke="#CBD5E1" strokeWidth={0.5}>
              <line x1={sx(x)} y1={sz(ZONE.zMax)} x2={sx(x)} y2={sz(ZONE.zMin)} />
              <line x1={sx(ZONE.xMin)} y1={sz(z)} x2={sx(ZONE.xMax)} y2={sz(z)} />
            </g>
          )
        })}
        {/* 홈플레이트 */}
        <polygon
          points={`${sx(-0.28)},${H - 12} ${sx(0.28)},${H - 12} ${sx(0.28)},${H - 8} ${sx(0)},${H - 4} ${sx(-0.28)},${H - 8}`}
          fill="#E2E8F0" stroke="#94A3B8" strokeWidth={0.5}
        />
        {/* 투구 점 */}
        {data.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.plate_x)} cy={sz(p.plate_z)} r={3.5}
            fill={colorFor(p, colorBy)} fillOpacity={0.75}
            stroke="#fff" strokeWidth={0.5}
          />
        ))}
      </svg>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
        {types.map(t => (
          <span key={t} className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: colorBy === 'result' ? (RESULT_COLORS[t] ?? '#9CA3AF') : (PITCH_COLORS[t] ?? '#9CA3AF') }}
            />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
})

export default PitchZoneMap
