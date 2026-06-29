import React from 'react'
import type { PitchArsenalTableProps, PitchArsenalRow } from '../../types'

const PT_COLOR: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777', 기타: '#9CA3AF',
}

const d3 = (v: number | null) => (v == null ? '—' : v.toFixed(3).replace(/^0/, '').replace(/^-0/, '-'))
const d1 = (v: number | null) => (v == null ? '—' : v.toFixed(1))
const i0 = (v: number | null) => (v == null ? '—' : String(Math.round(v)))

interface Col {
  key: string
  label: string
  render: (r: PitchArsenalRow) => string
  className?: string
  sticky?: boolean
}

const COLS: Col[] = [
  { key: 'count', label: '#', render: r => String(r.count) },
  { key: 'rhb', label: '우타', render: r => String(r.rhb) },
  { key: 'lhb', label: '좌타', render: r => String(r.lhb) },
  { key: 'pct', label: '%', render: r => r.pct.toFixed(1) },
  { key: 'velocity', label: '구속', render: r => d1(r.velocity) },
  { key: 'spin', label: 'Spin', render: r => i0(r.spin) },
  { key: 'pa', label: 'PA', render: r => String(r.pa) },
  { key: 'ab', label: 'AB', render: r => String(r.ab) },
  { key: 'h', label: 'H', render: r => String(r.h) },
  { key: 'b2', label: '2B', render: r => String(r.b2) },
  { key: 'b3', label: '3B', render: r => String(r.b3) },
  { key: 'hr', label: 'HR', render: r => String(r.hr) },
  { key: 'so', label: 'SO', render: r => String(r.so) },
  { key: 'bbe', label: 'BBE', render: r => String(r.bbe) },
  { key: 'ba', label: 'BA', render: r => d3(r.ba) },
  { key: 'xba', label: 'xBA', render: r => d3(r.xba) },
  { key: 'slg', label: 'SLG', render: r => d3(r.slg) },
  { key: 'xslg', label: 'xSLG', render: r => d3(r.xslg) },
  { key: 'woba', label: 'wOBA', render: r => d3(r.woba) },
  { key: 'xwoba', label: 'xwOBA', render: r => d3(r.xwoba) },
  { key: 'ev', label: 'EV', render: r => d1(r.ev) },
  { key: 'la', label: 'LA', render: r => d1(r.la) },
  { key: 'whiff_pct', label: 'Whiff%', render: r => r.whiff_pct.toFixed(1) },
  { key: 'putaway_pct', label: 'PutAway%', render: r => r.putaway_pct.toFixed(1) },
]

const PitchArsenalTable = React.memo(function PitchArsenalTable({ rows }: PitchArsenalTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]" data-testid="arsenal-empty">
        데이터가 없습니다.
      </div>
    )
  }

  // 연도 내림차순으로 이미 정렬되어 옴 — 연도 그룹 경계 표시용
  const seasons = Array.from(new Set(rows.map(r => r.season)))

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow" data-testid="pitch-arsenal-table">
      <table className="w-full min-w-max text-[11px] border-collapse">
        <thead>
          <tr className="bg-[#0A2240] text-white">
            <th className="sticky left-0 z-10 bg-[#0A2240] text-left px-2 py-1.5 font-semibold">연도</th>
            <th className="sticky left-[44px] z-10 bg-[#0A2240] text-left px-2 py-1.5 font-semibold">구종</th>
            {COLS.map(c => (
              <th key={c.key} className="px-2 py-1.5 font-semibold text-right whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const seasonIdx = seasons.indexOf(r.season)
            const zebra = seasonIdx % 2 === 0 ? 'bg-white' : 'bg-[#F4F6FA]'
            const firstOfSeason = idx === 0 || rows[idx - 1].season !== r.season
            return (
              <tr key={`${r.season}-${r.pitch_type}`}
                className={`${zebra} ${firstOfSeason ? 'border-t-2 border-[#CBD5E1]' : 'border-t border-[#EEF2F7]'} hover:bg-[#EFF6FF]`}>
                <td className={`sticky left-0 z-10 ${zebra} px-2 py-1 font-mono text-[var(--color-text-secondary)]`}>
                  {firstOfSeason ? r.season : ''}
                </td>
                <td className={`sticky left-[44px] z-10 ${zebra} px-2 py-1 font-medium whitespace-nowrap`}
                  style={{ color: PT_COLOR[r.pitch_type] ?? '#475569' }}>
                  {r.pitch_type}
                </td>
                {COLS.map(c => (
                  <td key={c.key} className="px-2 py-1 font-mono text-right text-[var(--color-text-primary)] whitespace-nowrap">
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-[var(--color-text-muted)] px-3 py-1.5">
        ! 연도 내림차순 · 구종은 시즌 내 투구수 많은 순 · 구속/EV 단위 km/h · x지표는 KBO 자체 EV+LA 모델
      </p>
    </div>
  )
})

export default PitchArsenalTable
