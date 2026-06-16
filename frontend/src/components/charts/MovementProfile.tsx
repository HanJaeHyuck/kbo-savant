import React from 'react'
import type { MovementProfileProps } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777',
}
const PITCH_SHORT: Record<string, string> = {
  직구: 'FF', 포심: 'FF', 슬라이더: 'SL', 체인지업: 'CH',
  커브: 'CU', 커터: 'FC', 싱커: 'SI', 스플리터: 'FS',
}
const c = (pt: string) => PITCH_COLORS[pt] ?? '#94A3B8'
const abbr = (pt: string) => PITCH_SHORT[pt] ?? pt.slice(0, 2)

const W = 310, H = 288
const CX = 148, CY = 144
const MAX_R = 112
const SCALE = 2.15   // px per cm of break
const RINGS = [15, 30, 45]  // cm guide rings

function ArmAngleIcon({ angle, ax, ay }: { angle: number; ax: number; ay: number }) {
  const rad = (angle * Math.PI) / 180
  const len = 16
  const dx = Math.sin(rad) * len
  const dy = -Math.cos(rad) * len
  return (
    <g>
      <circle cx={ax} cy={ay - 18} r={4.5} fill="#94A3B8" />
      <line x1={ax} y1={ay - 14} x2={ax} y2={ay - 1} stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" />
      <line x1={ax} y1={ay - 1} x2={ax - 5} y2={ay + 10} stroke="#94A3B8" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={ax} y1={ay - 1} x2={ax + 5} y2={ay + 10} stroke="#94A3B8" strokeWidth={1.5} strokeLinecap="round" />
      <line
        x1={ax} y1={ay - 8}
        x2={ax + dx} y2={ay - 8 + dy}
        stroke="#C0392B" strokeWidth={2.2} strokeLinecap="round"
      />
      <text x={ax} y={ay + 22} fontSize={7} fill="#64748B" textAnchor="middle" fontWeight="600">ARM ANGLE</text>
      <text x={ax} y={ay + 33} fontSize={11} fill="#C0392B" textAnchor="middle" fontWeight="bold">{angle.toFixed(0)}°</text>
    </g>
  )
}

const MovementProfile = React.memo(function MovementProfile({ data, armAngle }: MovementProfileProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]"
        data-testid="movement-empty">데이터가 없습니다.</div>
    )
  }
  const maxPct = Math.max(...data.map(d => d.pct), 1)

  return (
    <div data-testid="movement-profile">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W }} className="block mx-auto">
        {/* Outer background circle */}
        <circle cx={CX} cy={CY} r={MAX_R + 2} fill="#EEF2FF" />
        <circle cx={CX} cy={CY} r={MAX_R + 2} fill="none" stroke="#C7D2FE" strokeWidth={0.8} />

        {/* Concentric dashed guide rings */}
        {RINGS.map(r => {
          const pr = r * SCALE
          return (
            <g key={r}>
              <circle cx={CX} cy={CY} r={pr} fill="none" stroke="#A5B4FC" strokeWidth={0.6} strokeDasharray="3 2" />
              <text
                x={CX + pr * 0.72 + 2} y={CY - pr * 0.72 - 2}
                fontSize={7} fill="#94A3B8" textAnchor="start"
              >{r}</text>
            </g>
          )
        })}
        <text
          x={CX + RINGS[RINGS.length - 1] * SCALE * 0.72 + 16}
          y={CY - RINGS[RINGS.length - 1] * SCALE * 0.72 - 2}
          fontSize={7} fill="#94A3B8"
        >cm</text>

        {/* Cross axes */}
        <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} stroke="#94A3B8" strokeWidth={0.7} />
        <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} stroke="#94A3B8" strokeWidth={0.7} />

        {/* Vertical rise/drop labels */}
        <text x={8} y={CY - 10} fontSize={6.5} fill="#64748B">MORE</text>
        <text x={8} y={CY - 1} fontSize={6.5} fill="#64748B">RISE</text>
        <text x={11} y={CY + 10} fontSize={8} fill="#64748B">▲</text>
        <text x={11} y={CY + 24} fontSize={8} fill="#64748B">▼</text>
        <text x={8} y={CY + 35} fontSize={6.5} fill="#64748B">MORE</text>
        <text x={8} y={CY + 44} fontSize={6.5} fill="#64748B">DROP</text>

        {/* Horizontal axis hint */}
        <text x={CX} y={CY - MAX_R - 8} fontSize={7} fill="#94A3B8" textAnchor="middle">
          {'← GLOVE SIDE          ARM SIDE →'}
        </text>

        {/* Pitch clusters */}
        {data.map(d => {
          const px = CX + d.h_break * SCALE
          const py = CY - d.v_break * SCALE
          const r = 9 + (d.pct / maxPct) * 14
          return (
            <g key={d.pitch_type}>
              <circle cx={px} cy={py} r={r + 2} fill={c(d.pitch_type)} fillOpacity={0.18} />
              <circle cx={px} cy={py} r={r} fill={c(d.pitch_type)} fillOpacity={0.82} stroke="#fff" strokeWidth={1.2} />
              <text x={px} y={py + 3} fontSize={8} fill="#fff" textAnchor="middle" fontWeight="bold">
                {abbr(d.pitch_type)}
              </text>
            </g>
          )
        })}

        {/* Arm angle silhouette */}
        {armAngle != null && (
          <ArmAngleIcon angle={armAngle} ax={W - 46} ay={H - 54} />
        )}
      </svg>

      {/* Bottom stats table */}
      <div className="mt-0.5 overflow-x-auto px-1">
        <table className="w-full border-collapse" style={{ minWidth: 180 }}>
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-[8px] text-left font-normal text-gray-400 py-0.5 pr-2 w-14" />
              {data.map(d => (
                <th key={d.pitch_type} className="text-[10px] font-bold text-center px-1 py-0.5"
                  style={{ color: c(d.pitch_type) }}>
                  {abbr(d.pitch_type)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-[9px] text-gray-400 py-0.5 pr-2 font-medium">USAGE</td>
              {data.map(d => (
                <td key={d.pitch_type} className="text-[10px] font-mono text-center px-1 py-0.5 text-[var(--color-text-primary)]">
                  {d.pct.toFixed(0)}%
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-[9px] text-gray-400 py-0.5 pr-2 font-medium">km/h</td>
              {data.map(d => (
                <td key={d.pitch_type} className="text-[10px] font-mono text-center px-1 py-0.5 text-[var(--color-text-primary)]">
                  {d.avg_velocity.toFixed(1)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-[9px] text-gray-400 py-0.5 pr-2 font-medium">무브</td>
              {data.map(d => (
                <td key={d.pitch_type} className="text-[9px] font-mono text-center px-1 py-0.5 text-[var(--color-text-secondary)]">
                  {d.h_break > 0 ? '+' : ''}{d.h_break}/{d.v_break > 0 ? '+' : ''}{d.v_break}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default MovementProfile
