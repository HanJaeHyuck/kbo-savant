import React from 'react'
import type { ZoneHeatmapGridProps } from '../../types'

// 그리드 정의 (백엔드와 동일)
const NX = 7, NZ = 8
const XR = [-0.70, 0.70] as const
const ZR = [-0.05, 1.45] as const
const ZONE = { xMin: -0.28, xMax: 0.28, zMin: 0.45, zMax: 1.05 }

const CELL = 36
const PAD_L = 26, PAD_T = 10, PAD_R = 10, PAD_B = 24
const GRID_W = NX * CELL
const GRID_H = NZ * CELL
const W = PAD_L + GRID_W + PAD_R
const H = PAD_T + GRID_H + PAD_B

const px = (x: number) => PAD_L + ((x - XR[0]) / (XR[1] - XR[0])) * GRID_W
const pz = (z: number) => PAD_T + ((ZR[1] - z) / (ZR[1] - ZR[0])) * GRID_H

// 파랑(낮음) → 흰색(중간) → 빨강(높음) 발산형
function divColor(t: number): string {
  const c = Math.max(0, Math.min(1, t))
  if (c < 0.5) {
    const s = c / 0.5
    return `rgb(${Math.round(30 + s * 214)},${Math.round(58 + s * 188)},${Math.round(138 + s * 109)})`
  }
  const s = (c - 0.5) / 0.5
  return `rgb(${Math.round(244 - s * 52)},${Math.round(246 - s * 189)},${Math.round(247 - s * 204)})`
}

// 셀 밝기로 글자색 결정
function textOn(t: number): string {
  return t < 0.28 || t > 0.78 ? '#FFFFFF' : '#1E293B'
}

const ZoneHeatmapGrid = React.memo(function ZoneHeatmapGrid({ data, metric }: ZoneHeatmapGridProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]" data-testid="zone-empty">
        데이터가 없습니다.
      </div>
    )
  }

  const vals = data.map(d => d[metric])
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const norm = (v: number) => (max === min ? 0.5 : (v - min) / (max - min))

  const fmt = (v: number) =>
    metric === 'batting_avg' ? v.toFixed(3).replace(/^0/, '') : v.toFixed(0)

  const cw = GRID_W / NX
  const ch = GRID_H / NZ

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 300 }}
      data-testid="strike-zone-map" className="block mx-auto">
      {/* 셀 */}
      {data.map(cell => {
        const t = norm(cell[metric])
        const x = PAD_L + cell.col * cw
        // row 0 = 가장 낮은 z (하단) → 화면 상단은 높은 z
        const y = PAD_T + (NZ - 1 - cell.row) * ch
        const faded = cell.weight < 1.5  // 표본 매우 적은 칸은 흐리게
        return (
          <g key={`${cell.col}-${cell.row}`}>
            <rect x={x} y={y} width={cw} height={ch}
              fill={divColor(t)} fillOpacity={faded ? 0.35 : 1}
              stroke="#fff" strokeWidth={0.6} />
            <text x={x + cw / 2} y={y + ch / 2 + 3} fontSize={8.5}
              fill={faded ? '#94A3B8' : textOn(t)} textAnchor="middle" fontFamily="monospace">
              {fmt(cell[metric])}
            </text>
          </g>
        )
      })}

      {/* 스트라이크존 굵은 박스 */}
      <rect
        x={px(ZONE.xMin)} y={pz(ZONE.zMax)}
        width={px(ZONE.xMax) - px(ZONE.xMin)}
        height={pz(ZONE.zMin) - pz(ZONE.zMax)}
        fill="none" stroke="#111827" strokeWidth={2.4}
      />

      {/* 타자 시점 세로 라벨 */}
      <text x={9} y={PAD_T + GRID_H / 2} fontSize={8} fill="#64748B"
        textAnchor="middle" transform={`rotate(-90 9 ${PAD_T + GRID_H / 2})`}
        letterSpacing="1">타자 시점</text>

      {/* 하단 캡션 */}
      <text x={PAD_L + GRID_W / 2} y={H - 7} fontSize={8} fill="#94A3B8" textAnchor="middle">
        {metric === 'batting_avg' ? '피안타율 (낮을수록 파랑)' : 'Whiff% (높을수록 빨강)'}
      </text>
    </svg>
  )
})

export default ZoneHeatmapGrid
