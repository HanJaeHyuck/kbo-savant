import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { VeloTrendProps } from '../../types'

const VeloTrend = React.memo(function VeloTrend({ data }: VeloTrendProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
        데이터가 없습니다.
      </div>
    )
  }

  const formatted = data.map(d => ({
    ...d,
    label: d.game_date.slice(5),  // "MM-DD" 형식
  }))

  const velMin = Math.min(...data.map(d => d.avg_velocity)) - 3
  const velMax = Math.max(...data.map(d => d.avg_velocity)) + 3

  return (
    <div data-testid="velo-trend-chart" className="w-full">
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#64748B' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[velMin, velMax]}
            tick={{ fontSize: 10, fill: '#64748B' }}
            width={36}
            tickFormatter={(v: number) => `${v.toFixed(0)}`}
          />
          <Tooltip
            itemStyle={{ color: '#1E3A8A' }}
            labelStyle={{ color: '#64748B' }}
          />
          <Line
            type="monotone"
            dataKey="avg_velocity"
            stroke="#1E3A8A"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1E3A8A' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default VeloTrend
