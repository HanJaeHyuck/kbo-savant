interface ScoreboardCardProps {
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: 'scheduled' | 'live' | 'final'
  startTime?: string
  inning?: string
}

export default function ScoreboardCard({
  homeTeam, awayTeam, homeScore, awayScore, status, startTime, inning,
}: ScoreboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex-shrink-0" data-testid="scoreboard-card">
      <div className="flex items-center justify-between mb-2">
        {status === 'live' && (
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
        )}
        {status === 'scheduled' && startTime && (
          <span className="text-xs text-gray-400">{startTime}</span>
        )}
        {status === 'final' && (
          <span className="text-xs text-gray-400">종료</span>
        )}
        {inning && status === 'live' && (
          <span className="text-xs text-gray-500">{inning}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-center flex-1">
          <p className="text-xs font-medium text-gray-700 truncate">{awayTeam}</p>
          {awayScore !== undefined && (
            <p className="text-2xl font-bold font-mono text-[var(--color-primary)]">{awayScore}</p>
          )}
          {awayScore === undefined && <p className="text-lg text-gray-300">-</p>}
        </div>
        <span className="text-gray-300 text-sm">vs</span>
        <div className="text-center flex-1">
          <p className="text-xs font-medium text-gray-700 truncate">{homeTeam}</p>
          {homeScore !== undefined && (
            <p className="text-2xl font-bold font-mono text-[var(--color-primary)]">{homeScore}</p>
          )}
          {homeScore === undefined && <p className="text-lg text-gray-300">-</p>}
        </div>
      </div>
    </div>
  )
}
