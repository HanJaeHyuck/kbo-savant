import React from 'react'
import {
  Radar,
  RadarChart as RChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { RadarChartProps } from '../../types'

const PLAYER_COLORS = ['#C0392B', '#1E3A8A']

const RadarChart = React.memo(function RadarChart({ players, stats }: RadarChartProps) {
  if (!players || players.length === 0 || !stats || stats.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]"
        data-testid="radar-empty"
      >
        데이터가 없습니다.
      </div>
    )
  }

  const radarData = stats.map(stat => {
    const point: Record<string, number | string> = { stat }
    players.forEach(p => {
      point[p.name] = p.data[stat] ?? 0
    })
    return point
  })

  return (
    <div data-testid="radar-chart">
      <ResponsiveContainer width="100%" height={220}>
        <RChart data={radarData}>
          <PolarGrid gridType="polygon" stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fontSize: 10, fill: '#64748B' }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          {players.map((p, i) => (
            <Radar
              key={p.name}
              name={p.name}
              dataKey={p.name}
              stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
          {players.length > 1 && <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
        </RChart>
      </ResponsiveContainer>
    </div>
  )
})

export default RadarChart
