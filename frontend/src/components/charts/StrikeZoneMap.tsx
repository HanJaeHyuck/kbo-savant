import React from 'react'
import type { StrikeZoneMapProps, ZoneData } from '../../types'

// Color interpolation: blue → cream → red
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

function getZoneColor(norm: number): string {
  if (norm < 0.5) return lerpColor('#1E3A8A', '#F5F5DC', norm * 2)
  return lerpColor('#F5F5DC', '#C0392B', (norm - 0.5) * 2)
}

function formatValue(v: number, metric: 'batting_avg' | 'whiff_pct'): string {
  if (metric === 'batting_avg') return v.toFixed(3).replace(/^0/, '')
  return v.toFixed(1)
}

const ZONE_LAYOUT = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]
const OUTER_ZONES = [
  { zone: 11, label: '상', x: 80, y: 5,  w: 60, h: 20 },
  { zone: 12, label: '우', x: 185, y: 35, w: 20, h: 60 },
  { zone: 13, label: '하', x: 80, y: 160, w: 60, h: 20 },
  { zone: 14, label: '좌', x: 5, y: 35, w: 20, h: 60 },
]

const CELL = 60
const OFFSET_X = 30
const OFFSET_Y = 30

const StrikeZoneMap = React.memo(function StrikeZoneMap({ data, colorBy }: StrikeZoneMapProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]" data-testid="zone-empty">
        데이터가 없습니다.
      </div>
    )
  }

  const zoneMap = new Map<number, ZoneData>(data.map(d => [d.zone, d]))
  const values = data.map(d => d[colorBy])
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)

  const norm = (v: number) => maxVal === minVal ? 0.5 : (v - minVal) / (maxVal - minVal)

  const cellColor = (zone: number) => {
    const d = zoneMap.get(zone)
    if (!d) return '#E8ECF0'
    return getZoneColor(norm(d[colorBy]))
  }

  const W = OFFSET_X * 2 + CELL * 3
  const H = OFFSET_Y * 2 + CELL * 3

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ maxWidth: 240 }}
      data-testid="strike-zone-map"
    >
      {/* 스트라이크존 9셀 */}
      {ZONE_LAYOUT.map((row, ri) =>
        row.map((zone, ci) => {
          const x = OFFSET_X + ci * CELL
          const y = OFFSET_Y + ri * CELL
          const d = zoneMap.get(zone)
          const color = cellColor(zone)
          return (
            <g key={zone} data-testid="zone-cell">
              <rect
                x={x} y={y} width={CELL} height={CELL}
                fill={color} stroke="#94A3B8" strokeWidth={0.5}
              />
              <text x={x + 4} y={y + 12} fontSize={8} fill="#64748B">{zone}</text>
              {d && (
                <text
                  x={x + CELL / 2} y={y + CELL / 2 + 5}
                  fontSize={12} fontWeight="bold"
                  fill="#111" textAnchor="middle"
                  data-testid={`zone-value-${zone}`}
                >
                  {formatValue(d[colorBy], colorBy)}
                </text>
              )}
            </g>
          )
        })
      )}

      {/* 외곽 영역 표시 */}
      {OUTER_ZONES.map(({ zone, label, x, y, w, h }) => {
        const d = zoneMap.get(zone)
        const color = d ? getZoneColor(norm(d[colorBy])) : '#E8ECF0'
        return (
          <g key={zone}>
            <rect x={x} y={y} width={w} height={h} fill={color} stroke="#94A3B8" strokeWidth={0.5} rx={2} />
            <text x={x + w / 2} y={y + h / 2 + 4} fontSize={8} fill="#64748B" textAnchor="middle">{label}</text>
          </g>
        )
      })}

      {/* 스트라이크존 외곽선 */}
      <rect
        x={OFFSET_X} y={OFFSET_Y}
        width={CELL * 3} height={CELL * 3}
        fill="none" stroke="#334155" strokeWidth={2}
      />
    </svg>
  )
})

export default StrikeZoneMap
