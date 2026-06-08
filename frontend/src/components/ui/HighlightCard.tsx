import { Link } from 'react-router-dom'
import { getPercentileColor } from '../../utils/percentile'

interface HighlightCardProps {
  label: string
  value: string
  playerName: string
  playerId: number
  percentile?: number
}

export default function HighlightCard({ label, value, playerName, playerId, percentile = 90 }: HighlightCardProps) {
  const color = getPercentileColor(percentile)

  return (
    <Link
      to={`/players/${playerId}`}
      className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
      data-testid="highlight-card"
    >
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
      <p className="text-sm font-medium text-[var(--color-text-primary)] mt-1">{playerName}</p>
      <div className="mt-2 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: i < Math.round(percentile / 20) ? color : '#E2E8F0' }}
          />
        ))}
      </div>
    </Link>
  )
}
