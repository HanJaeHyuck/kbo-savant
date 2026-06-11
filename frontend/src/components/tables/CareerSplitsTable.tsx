import React from 'react'
import type { CareerSplitsTableProps, CareerRow } from '../../types'

type Col = {
  key: string
  label: string
  fmt: (v: number) => string
  lowerBetter?: boolean
  sum?: boolean // 통산 행에서 합산할 카운팅 스탯
}

const pct = (v: number) => `${v.toFixed(1)}%`
const dec3 = (v: number) => v.toFixed(3).replace(/^0/, '')
const dec2 = (v: number) => v.toFixed(2)
const dec1 = (v: number) => v.toFixed(1)
const int = (v: number) => String(Math.round(v))

const BATTER_COLS: Col[] = [
  { key: 'games', label: 'G', fmt: int, sum: true },
  { key: 'avg', label: 'AVG', fmt: dec3 },
  { key: 'obp', label: 'OBP', fmt: dec3 },
  { key: 'slg', label: 'SLG', fmt: dec3 },
  { key: 'ops', label: 'OPS', fmt: dec3 },
  { key: 'hr', label: 'HR', fmt: int, sum: true },
  { key: 'rbi', label: 'RBI', fmt: int, sum: true },
  { key: 'sb', label: 'SB', fmt: int, sum: true },
  { key: 'wrc_plus', label: 'wRC+', fmt: int },
  { key: 'war', label: 'WAR', fmt: dec1, sum: true },
  { key: 'hard_hit_pct', label: 'HH%', fmt: pct },
  { key: 'avg_ev', label: 'EV', fmt: dec1 },
]

const PITCHER_COLS: Col[] = [
  { key: 'games', label: 'G', fmt: int, sum: true },
  { key: 'gs', label: 'GS', fmt: int, sum: true },
  { key: 'ip', label: 'IP', fmt: dec1, sum: true },
  { key: 'era', label: 'ERA', fmt: dec2, lowerBetter: true },
  { key: 'fip', label: 'FIP', fmt: dec2, lowerBetter: true },
  { key: 'era_minus', label: 'ERA-', fmt: int, lowerBetter: true },
  { key: 'k_pct', label: 'K%', fmt: pct },
  { key: 'bb_pct', label: 'BB%', fmt: pct, lowerBetter: true },
  { key: 'war', label: 'WAR', fmt: dec1, sum: true },
  { key: 'csw_pct', label: 'CSW%', fmt: pct },
  { key: 'whiff_pct', label: 'Whiff%', fmt: pct },
  { key: 'hard_hit_pct', label: '허용HH%', fmt: pct, lowerBetter: true },
  { key: 'avg_ev_allowed', label: '허용EV', fmt: dec1, lowerBetter: true },
]

const CareerSplitsTable = React.memo(function CareerSplitsTable({
  data, type, selectedYear, onYearSelect,
}: CareerSplitsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]" data-testid="career-empty">
        커리어 데이터가 없습니다.
      </div>
    )
  }

  const cols = type === 'batter' ? BATTER_COLS : PITCHER_COLS
  const rows = [...data].sort((a, b) => b.season - a.season)

  // 컬럼별 커리어 최고/최저 (2시즌 이상일 때만 색상)
  const bestWorst: Record<string, { best: number; worst: number }> = {}
  for (const c of cols) {
    const vals = rows.map(r => r[c.key]).filter((v): v is number => typeof v === 'number')
    if (vals.length < 2) continue
    bestWorst[c.key] = { best: Math.max(...vals), worst: Math.min(...vals) }
  }

  const cellColor = (c: Col, v: number | null) => {
    if (v == null || !bestWorst[c.key]) return undefined
    const { best, worst } = bestWorst[c.key]
    const hi = c.lowerBetter ? worst : best
    const lo = c.lowerBetter ? best : worst
    if (v === hi) return '#C0392B'
    if (v === lo) return '#2980B9'
    return undefined
  }

  // 통산 행
  const total: CareerRow = { season: -1 }
  for (const c of cols) {
    const vals = rows.map(r => r[c.key]).filter((v): v is number => typeof v === 'number')
    if (vals.length === 0) { total[c.key] = null; continue }
    total[c.key] = c.sum ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const renderRow = (r: CareerRow, isTotal = false) => {
    const selected = !isTotal && r.season === selectedYear
    return (
      <tr
        key={isTotal ? 'total' : r.season}
        onClick={() => !isTotal && onYearSelect(r.season)}
        className={[
          isTotal ? 'border-t-2 border-[var(--color-border)] font-semibold' : 'cursor-pointer hover:bg-[#F1F5F9]',
          selected ? 'bg-[#EFF6FF]' : '',
        ].join(' ')}
        data-testid={isTotal ? 'career-total-row' : `career-row-${r.season}`}
      >
        <td className="px-2 py-1.5 text-xs font-mono font-bold text-[var(--color-text-primary)] sticky left-0 bg-inherit whitespace-nowrap">
          {isTotal ? '통산' : r.season}
        </td>
        {cols.map(c => {
          const v = r[c.key]
          return (
            <td
              key={c.key}
              className="px-2 py-1.5 text-xs font-mono text-right whitespace-nowrap"
              style={{ color: cellColor(c, v ?? null), fontWeight: cellColor(c, v ?? null) ? 700 : undefined }}
            >
              {typeof v === 'number' ? c.fmt(v) : '—'}
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <div className="overflow-x-auto max-w-full bg-white rounded-lg shadow" data-testid="career-splits-table">
      <table className="min-w-max w-full text-sm">
        <thead>
          <tr className="bg-[#0A2240] text-white">
            <th className="px-2 py-2 text-xs text-left sticky left-0 bg-[#0A2240]">시즌</th>
            {cols.map(c => (
              <th key={c.key} className="px-2 py-2 text-xs text-right whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => renderRow(r))}
          {rows.length > 1 && renderRow(total, true)}
        </tbody>
      </table>
    </div>
  )
})

export default CareerSplitsTable
