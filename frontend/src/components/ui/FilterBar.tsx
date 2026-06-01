interface FilterBarProps {
  seasons: number[]
  selectedSeason: number
  onSeasonChange: (s: number) => void
  teams?: string[]
  selectedTeam?: string
  onTeamChange?: (t: string) => void
}

export default function FilterBar({
  seasons, selectedSeason, onSeasonChange,
  teams, selectedTeam, onTeamChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={selectedSeason}
        onChange={e => onSeasonChange(Number(e.target.value))}
        className="px-3 py-1.5 border border-[var(--color-border)] rounded text-sm bg-white"
      >
        {seasons.map(s => <option key={s} value={s}>{s}년</option>)}
      </select>
      {teams && onTeamChange && (
        <select
          value={selectedTeam}
          onChange={e => onTeamChange(e.target.value)}
          className="px-3 py-1.5 border border-[var(--color-border)] rounded text-sm bg-white"
        >
          <option value="">전체 팀</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
    </div>
  )
}
