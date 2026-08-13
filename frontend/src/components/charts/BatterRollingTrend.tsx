import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { BatterRollingPoint } from '../../types'

type Metric = 'woba' | 'avg_ev' | 'hard_hit_pct'
const METRICS: { key: Metric; label: string; color: string; unit: string; digits: number }[] = [
  { key: 'woba', label: 'wOBA', color: '#C0392B', unit: '', digits: 3 },
  { key: 'avg_ev', label: '평균 EV', color: '#1E3A8A', unit: 'km/h', digits: 1 },
  { key: 'hard_hit_pct', label: '하드힛%', color: '#0F6E56', unit: '%', digits: 1 },
]

const BatterRollingTrend = React.memo(function BatterRollingTrend({ data }: { data: BatterRollingPoint[] }) {
  const [metric, setMetric] = useState<Metric>('woba')

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]" data-testid="batter-rolling-empty">데이터가 없습니다.</div>
  }

  const m = METRICS.find(x => x.key === metric)!
  const formatted = data.map(d => ({ ...d, label: d.game_date.slice(5) }))
  const vals = data.map(d => d[metric]).filter((v): v is number => typeof v === 'number')
  const pad = metric === 'woba' ? 0.05 : 5
  const yMin = Math.max(0, Math.min(...vals) - pad)
  const yMax = Math.max(...vals) + pad

  return (
    <div data-testid="batter-rolling-chart" className="w-full">
      <div className="flex items-center gap-1.5 mb-2">
        {METRICS.map(opt => (
          <button key={opt.key} onClick={() => setMetric(opt.key)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              metric === opt.key ? 'text-white border-transparent'
                : 'text-[var(--color-text-secondary)] border-[var(--color-border)] bg-white hover:bg-[#F4F6FA]'
            }`}
            style={metric === opt.key ? { background: opt.color } : undefined}
            data-testid={`batter-rolling-${opt.key}`}>
            {opt.label}
          </button>
        ))}
        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">5경기 이동평균</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: '#64748B' }} width={40}
            tickFormatter={(v: number) => metric === 'woba' ? v.toFixed(2) : v.toFixed(0)} />
          <Tooltip labelStyle={{ color: '#64748B' }}
            formatter={(v) => {
              const num = typeof v === 'number' ? v.toFixed(m.digits) : String(v ?? '—')
              return [`${num}${m.unit}`, m.label]
            }} />
          <Line type="monotone" dataKey={metric} name={m.label} stroke={m.color}
            strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default BatterRollingTrend
