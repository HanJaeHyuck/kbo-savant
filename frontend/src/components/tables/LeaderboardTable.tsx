import React from 'react'
import { getPercentileColor } from '../../utils/percentile'
import type { LeaderboardTableProps, LeaderboardRow } from '../../types'

interface Column {
  key: string
  label: string
  mobileHidden: boolean
}

const BATTING_COLUMNS: Column[] = [
  { key: 'war',          label: 'WAR',     mobileHidden: false },
  { key: 'wrc_plus',     label: 'wRC+',    mobileHidden: false },
  { key: 'ops',          label: 'OPS',     mobileHidden: true  },
  { key: 'hard_hit_pct', label: '하드힛%', mobileHidden: true  },
  { key: 'barrel_pct',   label: '배럴%',   mobileHidden: true  },
  { key: 'avg_ev',       label: '평균EV',  mobileHidden: true  },
]

const PITCHING_COLUMNS: Column[] = [
  { key: 'war',          label: 'WAR',      mobileHidden: false },
  { key: 'fip',          label: 'FIP',      mobileHidden: false },
  { key: 'era_minus',    label: 'ERA-',     mobileHidden: true  },
  { key: 'csw_pct',      label: 'CSW%',     mobileHidden: true  },
  { key: 'whiff_pct',    label: 'Whiff%',   mobileHidden: true  },
  { key: 'hard_hit_pct', label: '허용HH%',  mobileHidden: true  },
]

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
                    {val !== undefined && val !== null ? String(val) : '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default LeaderboardTable
