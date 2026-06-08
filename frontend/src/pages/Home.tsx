import { useNavigate, Link } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import PlayerSearchInput from '../components/ui/PlayerSearchInput'
import HighlightCard from '../components/ui/HighlightCard'
import SkeletonBlock from '../components/ui/SkeletonBlock'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type { Player } from '../types'

const HIGHLIGHTS = [
  { label: '최고 Hard-Hit%', value: '42.3%', playerName: '이정후', playerId: 1, percentile: 95 },
  { label: '최고 WAR (타자)', value: '7.2', playerName: '김도영', playerId: 2, percentile: 97 },
  { label: '최저 ERA- (투수)', value: '72', playerName: '양현종', playerId: 3, percentile: 91 },
]

interface LeaderboardRow {
  rank: number
  player_id: number
  name: string
  team: string
  war?: number
}

interface LeaderboardResponse {
  data: LeaderboardRow[]
}

export default function Home() {
  const navigate = useNavigate()
  const { data: battingRaw, loading: battingLoading } = useLeaderboard({ type: 'batting', stat: 'war', season: 2024, per_page: 5 })
  const { data: pitchingRaw, loading: pitchingLoading } = useLeaderboard({ type: 'pitching', stat: 'war', season: 2024, per_page: 5 })

  const battingData = battingRaw as LeaderboardResponse | null
  const pitchingData = pitchingRaw as LeaderboardResponse | null

  const handleSelect = (player: Player) => navigate(`/players/${player.id}`)

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />

      {/* 히어로 + 검색 */}
      <section className="bg-[#041E42] text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">KBO Savant</h1>
          <p className="text-blue-200 mb-8 text-sm md:text-base">
            타구속도·발사각·하드힛% 등 KBO 트래킹 기반 지표 분석 플랫폼
          </p>
          <PlayerSearchInput onSelect={handleSelect} placeholder="선수명을 입력하세요 (2글자 이상)" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8 space-y-10">

        {/* 섹션 2: 주목 선수 하이라이트 */}
        <section data-testid="highlights-section">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">이번 주 주목 선수</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HIGHLIGHTS.map((h) => (
              <HighlightCard key={h.playerId} {...h} />
            ))}
          </div>
        </section>

        {/* 섹션 3: WAR 리더보드 미리보기 */}
        <section data-testid="war-preview-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LeaderboardPreview
              title="타자 WAR Top 5"
              data={battingData?.data ?? null}
              loading={battingLoading}
              onRowClick={(id) => navigate(`/players/${id}`)}
            />
            <LeaderboardPreview
              title="투수 WAR Top 5"
              data={pitchingData?.data ?? null}
              loading={pitchingLoading}
              onRowClick={(id) => navigate(`/players/${id}`)}
            />
          </div>
        </section>

      </main>
    </div>
  )
}

function LeaderboardPreview({
  title, data, loading, onRowClick,
}: {
  title: string
  data: LeaderboardRow[] | null
  loading: boolean
  onRowClick: (id: number) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[var(--color-text-primary)]">{title}</h2>
        <Link to="/leaderboard" className="text-xs text-[var(--color-primary-mid)] hover:underline">
          전체보기 →
        </Link>
      </div>
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <SkeletonBlock key={i} height="32px" />)}
        </div>
      )}
      {!loading && data && data.length > 0 && (
        <table className="w-full text-sm">
          <tbody>
            {data.map((row) => (
              <tr
                key={row.player_id}
                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick(row.player_id)}
              >
                <td className="py-2 w-6 text-[var(--color-text-muted)]">{row.rank}</td>
                <td className="py-2 font-medium">{row.name}</td>
                <td className="py-2 text-xs text-[var(--color-text-secondary)]">{row.team}</td>
                <td className="py-2 text-right font-mono font-bold text-[var(--color-accent)]">
                  {row.war ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && (!data || data.length === 0) && (
        <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">데이터가 없습니다.</p>
      )}
    </div>
  )
}
