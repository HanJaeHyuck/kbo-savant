import React from 'react'
import type { BatterArsenalRow } from '../../types'

const PT_COLOR: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777', 기타: '#9CA3AF',
}
const d3 = (v: number) => v.toFixed(3).replace(/^0/, '')
const d1 = (v: number) => v.toFixed(1)

const COLS: { key: keyof BatterArsenalRow; label: string; fmt: (v: number) => string }[] = [
  { key: 'bbe', label: '타구', fmt: v => String(v) },
  { key: 'pct', label: '%', fmt: d1 },
  { key: 'ba', label: 'BA', fmt: d3 },
  { key: 'slg', label: 'SLG', fmt: d3 },
  { key: 'woba', label: 'wOBA', fmt: d3 },
  { key: 'hr', label: 'HR', fmt: v => String(v) },
  { key: 'avg_ev', label: 'EV', fmt: d1 },
  { key: 'avg_la', label: 'LA', fmt: d1 },
  { key: 'hard_hit_pct', label: 'HH%', fmt: d1 },
  { key: 'barrel_pct', label: 'Barrel%', fmt: d1 },
  { key: 'sweet_spot_pct', label: 'SwSpot%', fmt: d1 },
]

const BatterArsenalTable = React.memo(function BatterArsenalTable({ rows }: { rows: BatterArsenalRow[] }) {
  if (!rows || rows.length === 0) {
    return <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]" data-testid="batter-arsenal-empty">데이터가 없습니다.</div>
  }
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow" data-testid="batter-arsenal-table">
      <table className="w-full min-w-max text-[11px] border-collapse">
        <thead>
          <tr className="bg-[#0A2240] text-white">
            <th className="sticky left-0 z-10 bg-[#0A2240] text-left px-2 py-1.5 font-semibold">구종</th>
            {COLS.map(c => <th key={String(c.key)} className="px-2 py-1.5 font-semibold text-right whitespace-nowrap">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const zebra = i % 2 === 0 ? 'bg-white' : 'bg-[#F4F6FA]'
            return (
              <tr key={r.pitch_type} className={`${zebra} border-t border-[#EEF2F7] hover:bg-[#EFF6FF]`}>
                <td className={`sticky left-0 z-10 ${zebra} px-2 py-1 font-medium whitespace-nowrap`}
                  style={{ color: PT_COLOR[r.pitch_type] ?? '#475569' }}>{r.pitch_type}</td>
                {COLS.map(c => (
                  <td key={String(c.key)} className="px-2 py-1 font-mono text-right text-[var(--color-text-primary)] whitespace-nowrap">
                    {c.fmt(r[c.key] as number)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-[var(--color-text-muted)] px-3 py-1.5">
        ! 구종별 인플레이 타구 기준 · EV km/h · LA 도 · 타구 많은 순
      </p>
    </div>
  )
})

export default BatterArsenalTable
