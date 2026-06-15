import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { VeloTrendProps } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777',
}
const RESERVED = new Set(['game_date', 'avg_velocity', 'label'])

const VeloTrend = React.memo(function VeloTrend({ data }: VeloTrendProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]" data-testid="velo-trend-chart">
        데이터가 없습니다.
      </div>
    )
  }

  const formatted = data.map(d => ({ ...d, label: d.game_date.slice(5) }))

  // 데이터에 존재하는 구종 키 추출
  const types = Array.from(
    new Set(data.flatMap(d => Object.keys(d).filter(k => !RESERVED.has(k))))
  )
  const series = types.length > 0 ? types : ['avg_velocity']

  const allVals = data.flatMap(d => series.map(s => d[s]).filter((v): v is number => typeof v === 'number'))
  const velMin = Math.min(...allVals) - 3
  const velMax = Math.max(...allVals) + 3

  return (
    <div data-testid="velo-trend-chart" className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
          <YAxis domain={[velMin, velMax]} tick={{ fontSize: 10, fill: '#64748B' }} width={36} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
          <Tooltip labelStyle={{ color: '#64748B' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {series.map(s => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s === 'avg_velocity' ? '평균' : s}
              stroke={PITCH_COLORS[s] ?? '#1E3A8A'}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default VeloTrend
