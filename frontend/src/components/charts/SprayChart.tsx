import React from 'react'
import type { SprayChartProps } from '../../types'

const W = 280
const H = 265
const CX = 140
const CY = 252

// Pre-computed field coordinates
const SIN45 = 0.7071
const OF_R = 168
const OFL_X = Math.round(CX - OF_R * SIN45)   // 21
const OFR_X = Math.round(CX + OF_R * SIN45)   // 259
const OFY   = Math.round(CY - OF_R * SIN45)   // 133
const IF_R  = 95
const IFL_X = Math.round(CX - IF_R * SIN45)   // 73
const IFR_X = Math.round(CX + IF_R * SIN45)   // 207
const IFY   = Math.round(CY - IF_R * SIN45)   // 185

function lerpColor(a: string, b: string, t: number): string {
  const p = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const [ar, ag, ab] = p(a)
  const [br, bg, bb] = p(b)
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`
}

function getEVColor(ev: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (ev - min) / (max - min)
  if (t < 0.5) return lerpColor('#1E3A8A', '#F5F5DC', t * 2)
  return lerpColor('#F5F5DC', '#C0392B', (t - 0.5) * 2)
}

function getResultColor(result: string): string {
  if (result === '홈런') return '#C0392B'
  if (['안타', '2루타', '3루타'].includes(result)) return '#E67E22'
  return '#94A3B8'
}

function toSVG(sx: number, sy: number): [number, number] {
  return [CX + sx, CY - sy * 0.92]
}

const SprayChart = React.memo(function SprayChart({ data, colorBy }: SprayChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]"
        data-testid="spray-empty"
      >
        데이터가 없습니다.
      </div>
    )
  }

  const evMin = Math.min(...data.map(d => d.exit_velocity))
  const evMax = Math.max(...data.map(d => d.exit_velocity))

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ maxWidth: W }}
      data-testid="spray-chart"
    >
      {/* Outfield sector */}
      <path
        d={`M ${CX} ${CY} L ${OFL_X} ${OFY} A ${OF_R} ${OF_R} 0 0 1 ${OFR_X} ${OFY} Z`}
        fill="#4A7C59"
        opacity={0.25}
      />
      {/* Infield sector */}
      <path
        d={`M ${CX} ${CY} L ${IFL_X} ${IFY} A ${IF_R} ${IF_R} 0 0 1 ${IFR_X} ${IFY} Z`}
        fill="#C19A6B"
        opacity={0.3}
      />
      {/* Diamond */}
      <polygon
        points={`${CX},${CY} ${CX + 70},${CY - 70} ${CX},${CY - 140} ${CX - 70},${CY - 70}`}
        fill="#E5C99A"
        stroke="#8B6914"
        strokeWidth={1}
        opacity={0.5}
      />
      {/* Foul lines */}
      <line x1={CX} y1={CY} x2={CX - 196} y2={CY - 196} stroke="#CCCCCC" strokeWidth={1} opacity={0.5} />
      <line x1={CX} y1={CY} x2={CX + 196} y2={CY - 196} stroke="#CCCCCC" strokeWidth={1} opacity={0.5} />
      {/* Outfield wall */}
      <path
        d={`M ${OFL_X} ${OFY} A ${OF_R} ${OF_R} 0 0 1 ${OFR_X} ${OFY}`}
        fill="none"
        stroke="#557A55"
        strokeWidth={2}
        opacity={0.5}
      />
      {/* Home plate */}
      <circle cx={CX} cy={CY} r={4} fill="white" stroke="#334155" strokeWidth={1} />

      {/* Batted ball dots */}
      {data.map((d, i) => {
        const [x, y] = toSVG(d.spray_x, d.spray_y)
        const color = colorBy === 'result'
          ? getResultColor(d.result)
          : getEVColor(d.exit_velocity, evMin, evMax)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill={color}
            opacity={0.75}
            data-testid="spray-dot"
          />
        )
      })}
    </svg>
  )
})

export default SprayChart
