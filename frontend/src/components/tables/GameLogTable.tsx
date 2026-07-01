import React from 'react'
import type { GameLogTableProps } from '../../types'

const GameLogTable = React.memo(function GameLogTable({ rows }: GameLogTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)]" data-testid="game-log-empty">
        데이터가 없습니다.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto" data-testid="game-log-table">
      <table className="w-full min-w-max text-[11px] border-collapse">
        <thead>
          <tr className="bg-[#F4F6FA] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="text-left font-normal px-2 py-1.5">날짜</th>
            <th className="text-right font-normal px-2 py-1.5">투구</th>
            <th className="text-right font-normal px-2 py-1.5">K</th>
            <th className="text-right font-normal px-2 py-1.5">BB</th>
            <th className="text-right font-normal px-2 py-1.5">헛스윙</th>
            <th className="text-right font-normal px-2 py-1.5">인플레이</th>
            <th className="text-right font-normal px-2 py-1.5">평균구속</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map(r => (
            <tr key={r.game_date} className="border-b border-[#EEF2F7] hover:bg-[#EFF6FF]">
              <td className="text-left px-2 py-1 font-sans text-[var(--color-text-secondary)]">{r.game_date}</td>
              <td className="text-right px-2 py-1 text-[var(--color-text-primary)]">{r.pitches}</td>
              <td className="text-right px-2 py-1 text-[var(--color-text-primary)]">{r.k}</td>
              <td className="text-right px-2 py-1 text-[var(--color-text-secondary)]">{r.bb}</td>
              <td className="text-right px-2 py-1 text-[var(--color-text-secondary)]">{r.whiffs}</td>
              <td className="text-right px-2 py-1 text-[var(--color-text-secondary)]">{r.inplay}</td>
              <td className="text-right px-2 py-1 text-[var(--color-text-primary)]">{r.avg_velocity != null ? r.avg_velocity.toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-[var(--color-text-muted)] px-2 py-1.5">
        ! 최근 등판순 · 구속 km/h · 시드 데이터에 실점·이닝·상대 정보가 없어 투구 기준 항목만 표시
      </p>
    </div>
  )
})

export default GameLogTable
