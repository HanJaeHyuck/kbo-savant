import { useNavigate, useSearchParams } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import FilterBar from '../components/ui/FilterBar'
import LeaderboardTable from '../components/tables/LeaderboardTable'
import SkeletonBlock from '../components/ui/SkeletonBlock'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type { LeaderboardRow } from '../types'

const KBO_TEAMS = ['KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움']
const SEASONS = [2024, 2023, 2022]

interface LeaderboardData {
  data: LeaderboardRow[]
  total: number
  page: number
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const type = (searchParams.get('type') as 'batting' | 'pitching') ?? 'batting'
  const sortStat = searchParams.get('sort') ?? 'war'
  const sortDir = (searchParams.get('dir') as 'asc' | 'desc') ?? 'desc'
  const selectedTeam = searchParams.get('team') ?? ''
  const season = Number(searchParams.get('season')) || 2024

  const { data: raw, loading } = useLeaderboard({ type, stat: sortStat, season, team: selectedTeam, per_page: 30 })
  const leaderboard = raw as LeaderboardData | null

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next)
  }

  const handleSort = (col: string) => {
    const next = new URLSearchParams(searchParams)
    if (sortStat === col) {
      next.set('dir', sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      next.set('sort', col)
      next.set('dir', 'desc')
    }
    setSearchParams(next)
  }

  const handleTypeChange = (t: 'batting' | 'pitching') => {
    setSearchParams({ type: t, sort: 'war', dir: 'desc' })
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">리더보드</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          KBO 선수 스탯 순위 (트래킹 지표 포함)
        </p>

        {/* 타입 탭 */}
        <div className="flex gap-0 mb-4 border-b border-[var(--color-border)]" data-testid="type-tabs">
          {(['batting', 'pitching'] as const).map((t) => (
            <button
              key={t}
              data-testid={`tab-${t}`}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                type === t
                  ? 'border-[var(--color-primary-mid)] text-[var(--color-primary-mid)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              onClick={() => handleTypeChange(t)}
            >
              {t === 'batting' ? '타자' : '투수'}
            </button>
          ))}
        </div>

        {/* 필터 바 */}
        <FilterBar
          seasons={SEASONS}
          selectedSeason={season}
          onSeasonChange={(s) => setParam('season', String(s))}
          teams={KBO_TEAMS}
          selectedTeam={selectedTeam}
          onTeamChange={(t) => setParam('team', t)}
        />

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && (
            <div className="p-4 space-y-2">
              {[...Array(10)].map((_, i) => <SkeletonBlock key={i} height="40px" />)}
            </div>
          )}

          {!loading && leaderboard && leaderboard.data.length > 0 && (
            <LeaderboardTable
              data={leaderboard.data}
              type={type}
              sortStat={sortStat}
              sortDir={sortDir}
              onSort={handleSort}
              onPlayerClick={(id) => navigate(`/players/${id}`)}
            />
          )}

          {!loading && (!leaderboard || leaderboard.data.length === 0) && (
            <p className="text-center text-[var(--color-text-muted)] py-16">데이터가 없습니다.</p>
          )}
        </div>
      </main>
    </div>
  )
}
