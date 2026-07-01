import React from 'react'
import type { BattedBallProfileProps } from '../../types'

const TYPE_ROWS = [
  { key: 'gb', label: '땅볼 GB', color: '#65A30D' },
  { key: 'ld', label: '라이너 LD', color: '#C0392B' },
  { key: 'fb', label: '뜬공 FB', color: '#2563EB' },
  { key: 'pu', label: '팝플라이 PU', color: '#9CA3AF' },
] as const

const SPRAY_ROWS = [
  { key: 'pull', label: 'Pull (당겨친)', color: '#C0392B' },
  { key: 'center', label: 'Center (가운데)', color: '#95A5A6' },
  { key: 'oppo', label: 'Oppo (밀어친)', color: '#2980B9' },
] as const

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 text-[var(--color-text-secondary)]">{label}</span>
      <span className="flex-1 h-3 bg-[#F1F5F9] rounded overflow-hidden">
        <span className="block h-full rounded" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </span>
      <span className="w-11 text-right font-mono text-[var(--color-text-primary)]">{pct.toFixed(1)}%</span>
    </div>
  )
}

const BattedBallProfile = React.memo(function BattedBallProfile({ data }: BattedBallProfileProps) {
  if (!data || !data.bbe) {
    return <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]" data-testid="batted-profile-empty">데이터가 없습니다.</div>
  }
  return (
    <div className="space-y-3" data-testid="batted-profile">
      <div>
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">타구 종류</p>
        <div className="space-y-1.5">
          {TYPE_ROWS.map(r => <Bar key={r.key} label={r.label} pct={data.batted_type[r.key]} color={r.color} />)}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">타구 방향 (허용)</p>
        <div className="space-y-1.5">
          {SPRAY_ROWS.map(r => <Bar key={r.key} label={r.label} pct={data.spray[r.key]} color={r.color} />)}
        </div>
      </div>
      <p className="text-[9px] text-[var(--color-text-muted)]">허용 타구 {data.bbe}개 기준 · Pull/Oppo는 타자 손 기준</p>
    </div>
  )
})

export default BattedBallProfile
