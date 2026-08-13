import React from 'react'
import type { BatterVsHandData, BatterHandStat } from '../../types'

const f3 = (v: number) => v.toFixed(3).replace(/^0/, '')
const f1 = (v: number) => v.toFixed(1)

interface Row {
  key: keyof BatterHandStat
  label: string
  fmt: (v: number) => string
}
const ROWS: Row[] = [
  { key: 'ba', label: '타율', fmt: f3 },
  { key: 'slg', label: '장타율', fmt: f3 },
  { key: 'woba', label: 'wOBA', fmt: f3 },
  { key: 'avg_ev', label: '평균 EV', fmt: f1 },
  { key: 'hard_hit_pct', label: '하드힛%', fmt: f1 },
  { key: 'barrel_pct', label: '배럴%', fmt: f1 },
  { key: 'sweet_spot_pct', label: '스위트스팟%', fmt: f1 },
]

const BatterVsHandSplits = React.memo(function BatterVsHandSplits({ data }: { data: BatterVsHandData }) {
  if (!data) return null
  const { L, R } = data

  const cell = (row: Row, side: 'L' | 'R') => {
    const v = (side === 'L' ? L : R)[row.key] as number
    const other = (side === 'L' ? R : L)[row.key] as number
    const better = v > other   // 타자는 모두 높을수록 우수
    return (
      <td className={`text-right py-1 font-mono ${better ? 'font-bold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
        {row.fmt(v)}
      </td>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-3" data-testid="batter-vs-hand">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">vs 좌/우투 성적</p>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="text-left font-normal py-1">지표</th>
            <th className="text-right font-normal py-1">vs 좌투<span className="block text-[9px]">{L.bbe}타구</span></th>
            <th className="text-right font-normal py-1">vs 우투<span className="block text-[9px]">{R.bbe}타구</span></th>
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
      <p className="text-[9px] text-[var(--color-text-muted)] mt-1.5">굵은 값 = 해당 손 상대로 더 우수 · 인플레이 타구 기준</p>
    </div>
  )
})

export default BatterVsHandSplits
