import React from 'react'
import type { VsHandSplitsProps, VsHandStat } from '../../types'

const f3 = (v: number) => v.toFixed(3).replace(/^0/, '')
const f1 = (v: number) => v.toFixed(1)

interface Row {
  key: keyof VsHandStat
  label: string
  fmt: (v: number) => string
  higherBetter: boolean
}
const ROWS: Row[] = [
  { key: 'ba', label: '피안타율', fmt: f3, higherBetter: false },
  { key: 'woba', label: 'wOBA', fmt: f3, higherBetter: false },
  { key: 'whiff_pct', label: 'Whiff%', fmt: v => `${f1(v)}`, higherBetter: true },
  { key: 'chase_pct', label: 'Chase%', fmt: v => `${f1(v)}`, higherBetter: true },
  { key: 'csw_pct', label: 'CSW%', fmt: v => `${f1(v)}`, higherBetter: true },
  { key: 'hard_hit_pct', label: '허용 HH%', fmt: v => `${f1(v)}`, higherBetter: false },
  { key: 'avg_ev', label: '허용 EV', fmt: f1, higherBetter: false },
]

const VsHandSplits = React.memo(function VsHandSplits({ data }: VsHandSplitsProps) {
  if (!data) return null
  const { L, R } = data

  const cell = (row: Row, side: 'L' | 'R') => {
    const v = (side === 'L' ? L : R)[row.key] as number
    const other = (side === 'L' ? R : L)[row.key] as number
    const better = row.higherBetter ? v > other : v < other
    return (
      <td className={`text-right py-1 font-mono ${better ? 'font-bold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
        {row.fmt(v)}
      </td>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-3" data-testid="vs-hand-splits">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">vs 좌/우타 성적</p>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="text-left font-normal py-1">지표</th>
            <th className="text-right font-normal py-1">vs 좌타<span className="block text-[9px] text-[var(--color-text-muted)]">{L.pitches}구</span></th>
            <th className="text-right font-normal py-1">vs 우타<span className="block text-[9px] text-[var(--color-text-muted)]">{R.pitches}구</span></th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(row => (
            <tr key={row.key} className="border-b border-[#F1F5F9]">
              <td className="py-1 text-[var(--color-text-secondary)]">{row.label}</td>
              {cell(row, 'L')}
              {cell(row, 'R')}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[9px] text-[var(--color-text-muted)] mt-1.5">굵은 값 = 해당 손 상대로 더 우수 · 피안타율은 인플레이 기준</p>
    </div>
  )
})

export default VsHandSplits
