import React from 'react'
import { getPercentileColor } from '../../utils/percentile'
import type { LeaderboardTableProps, LeaderboardRow } from '../../types'

interface Column {
  key: string
  label: string
  mobileHidden: boolean
  fmt?: 'rate' | 'pct' | 'num1' | 'num2' | 'int'
  demo?: boolean   // KBO 미공개(트래킹) 파생 지표
}

const BATTING_COLUMNS: Column[] = [
  { key: 'war',            label: 'WAR',      mobileHidden: false, fmt: 'num1' },
  { key: 'wrc_plus',       label: 'wRC+',     mobileHidden: false, fmt: 'int'  },
  { key: 'ops',            label: 'OPS',      mobileHidden: true,  fmt: 'rate' },
  { key: 'woba',           label: 'wOBA',     mobileHidden: true,  fmt: 'rate' },
  { key: 'hard_hit_pct',   label: '하드힛%',  mobileHidden: true,  fmt: 'pct', demo: true },
  { key: 'barrel_pct',     label: '배럴%',    mobileHidden: true,  fmt: 'pct', demo: true },
  { key: 'avg_ev',         label: '평균EV',   mobileHidden: true,  fmt: 'num1', demo: true },
  { key: 'sweet_spot_pct', label: 'SwSpot%',  mobileHidden: true,  fmt: 'pct', demo: true },
  { key: 'xba',            label: 'xBA',      mobileHidden: true,  fmt: 'rate', demo: true },
  { key: 'xwoba',          label: 'xwOBA',    mobileHidden: true,  fmt: 'rate', demo: true },
]

const PITCHING_COLUMNS: Column[] = [
  { key: 'war',            label: 'WAR',      mobileHidden: false, fmt: 'num1' },
  { key: 'fip',            label: 'FIP',      mobileHidden: false, fmt: 'num2' },
  { key: 'era',            label: 'ERA',      mobileHidden: true,  fmt: 'num2' },
  { key: 'era_minus',      label: 'ERA-',     mobileHidden: true,  fmt: 'int'  },
  { key: 'k_pct',          label: 'K%',       mobileHidden: true,  fmt: 'pct'  },
  { key: 'csw_pct',        label: 'CSW%',     mobileHidden: true,  fmt: 'pct', demo: true },
  { key: 'whiff_pct',      label: 'Whiff%',   mobileHidden: true,  fmt: 'pct', demo: true },
  { key: 'hard_hit_pct',   label: '허용HH%',  mobileHidden: true,  fmt: 'pct', demo: true },
  { key: 'xera',           label: 'xERA',     mobileHidden: true,  fmt: 'num2', demo: true },
  { key: 'fastball_velo',  label: '구속',     mobileHidden: true,  fmt: 'num1', demo: true },
]

function fmtValue(v: unknown, fmt?: Column['fmt']): string {
  if (v === undefined || v === null) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  switch (fmt) {
    case 'rate': return n.toFixed(3).replace(/^0/, '')
    case 'pct':  return n.toFixed(1)
    case 'num1': return n.toFixed(1)
    case 'num2': return n.toFixed(2)
    case 'int':  return String(Math.round(n))
    default:     return String(v)
  }
}

interface ExtendedProps extends LeaderboardTableProps {
  sortStat: string
  sortDir: 'asc' | 'desc'
  onSort: (stat: string) => void
}

const LeaderboardTable = React.memo(function LeaderboardTable({
  data, type, onPlayerClick, sortStat, sortDir, onSort,
}: ExtendedProps) {
  const columns = type === 'batting' ? BATTING_COLUMNS : PITCHING_COLUMNS

  return (
    <div className="overflow-x-auto" data-testid="leaderboard-table">
      <table className="w-full text-sm min-w-[500px]">
        <thead className="bg-[var(--color-primary)] text-white">
          <tr>
            <th className="px-3 py-2 text-left w-8 text-xs">#</th>
            <th className="px-3 py-2 text-left">선수</th>
            <th className="px-3 py-2 text-left hidden md:table-cell text-xs">팀</th>
            {columns.map(col => (
              <th
                key={col.key}
                data-testid={`header-${col.key}`}
                className={`px-3 py-2 text-right cursor-pointer hover:bg-[var(--color-nav-hover)] select-none text-xs ${col.mobileHidden ? 'hidden md:table-cell' : ''}`}
                onClick={() => onSort(col.key)}
              >
                <span className="whitespace-nowrap">
                  {col.demo && (
                    <span
                      title="KBO 미공개 트래킹 지표 — 데모(샘플) 값"
                      className="mr-0.5 text-[8px] align-top text-[#FDE68A]"
                    >●</span>
                  )}
                  {col.label}
                  {sortStat === col.key && (
                    <span className="ml-0.5">{sortDir === 'desc' ? ' ▼' : ' ▲'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: LeaderboardRow) => (
            <tr
              key={row.player_id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onPlayerClick(row.player_id)}
              data-testid="leaderboard-row"
            >
              <td className="px-3 py-2 text-[var(--color-text-muted)] text-xs">{row.rank}</td>
              <td className="px-3 py-2 font-medium text-[var(--color-text-primary)]">{row.name}</td>
              <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] hidden md:table-cell">{row.team}</td>
              {columns.map(col => {
                const val = row[col.key]
                const pct = row[`percentile_${col.key}`] as number | undefined
                const color = pct !== undefined ? getPercentileColor(pct) : undefined
                return (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-right font-mono ${col.mobileHidden ? 'hidden md:table-cell' : ''}`}
                    style={color ? { color } : undefined}
                  >
                    {fmtValue(val, col.fmt)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-[var(--color-text-muted)] px-3 py-2">
        <span className="text-[#E0A800]">●</span> 표시 지표는 KBO가 트래킹 데이터를 공개하지 않아 현재 데모(샘플) 값입니다.
      </p>
    </div>
  )
})

export default LeaderboardTable
