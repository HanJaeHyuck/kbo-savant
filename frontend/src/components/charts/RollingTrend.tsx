import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { RollingPoint, RollingTrendProps } from '../../types'

type Metric = 'velocity' | 'whiff_pct' | 'csw_pct'
const METRICS: { key: Metric; label: string; color: string; unit: string }[] = [
  { key: 'velocity', label: '구속', color: '#1E3A8A', unit: 'km/h' },
  { key: 'whiff_pct', label: 'Whiff%', color: '#C0392B', unit: '%' },
  { key: 'csw_pct', label: 'CSW%', color: '#0F6E56', unit: '%' },
]

const RollingTrend = React.memo(function RollingTrend({ data }: RollingTrendProps) {
  const [metric, setMetric] = useState<Metric>('velocity')

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]" data-testid="rolling-trend-empty">
        데이터가 없습니다.
      </div>
    )
  }

  const m = METRICS.find(x => x.key === metric)!
  const formatted = data.map((d: RollingPoint) => ({ ...d, label: d.game_date.slice(5) }))
  const vals = data.map(d => d[metric]).filter((v): v is number => typeof v === 'number')
  const pad = metric === 'velocity' ? 3 : 5
  const yMin = Math.max(0, Math.min(...vals) - pad)
  const yMax = Math.max(...vals) + pad

  return (
    <div data-testid="rolling-trend-chart" className="w-full">
      <div className="flex items-center gap-1.5 mb-2">
        {METRICS.map(opt => (
          <button key={opt.key} onClick={() => setMetric(opt.key)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              metric === opt.key
                ? 'text-white border-transparent'
                : 'text-[var(--color-text-secondary)] border-[var(--color-border)] bg-white hover:bg-[#F4F6FA]'
            }`}
            style={metric === opt.key ? { background: opt.color } : undefined}
            data-testid={`rolling-metric-${opt.key}`}>
            {opt.label}
          </button>
        ))}
        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">3경기 이동평균</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
          <YAxis domain={[Math.floor(yMin), Math.ceil(yMax)]} tick={{ fontSize: 10, fill: '#64748B' }} width={36}
            tickFormatter={(v: number) => v.toFixed(0)} />
          <Tooltip
            labelStyle={{ color: '#64748B' }}
            formatter={(v) => {
              const num = typeof v === 'number' ? v.toFixed(1) : String(v ?? '—')
              return [`${num}${m.unit}`, m.label]
            }}
          />
          <Line type="monotone" dataKey={metric} name={m.label} stroke={m.color}
            strokeWidth={2.4} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default RollingTrend
