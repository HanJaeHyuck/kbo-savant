import { useEffect, useState } from 'react'
import { getGames } from '../../api/games'
import SkeletonBlock from './SkeletonBlock'
import type { GameRow, GameTeam } from '../../types'

const LIVE_CODES = new Set([2])   // game_sc: 1=예정, 2=진행, 3=종료

function statusStyle(status: string | null, code: number | null) {
  if (code != null && LIVE_CODES.has(code)) return { bg: '#C0392B', label: 'LIVE' }
  if (status === '경기종료') return { bg: '#64748B', label: '종료' }
  if (status === '경기취소' || status === '취소') return { bg: '#94A3B8', label: '취소' }
  return { bg: '#1E3A8A', label: '예정' }
}

function TeamLine({ team, opponent, showScore }: { team: GameTeam; opponent: GameTeam; showScore: boolean }) {
  const won = showScore && team.score != null && opponent.score != null && team.score > opponent.score
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-[13px] truncate ${won ? 'font-bold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
        {team.name ?? '-'}
      </span>
      {showScore ? (
        <span className={`text-base font-mono tabular-nums ${won ? 'font-bold text-[#C0392B]' : 'text-[var(--color-text-secondary)]'}`}>
          {team.score ?? '-'}
        </span>
      ) : (
        <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[72px]">
          {team.pitcher ? `선 ${team.pitcher}` : ''}
        </span>
      )}
    </div>
  )
}

function GameCard({ g }: { g: GameRow }) {
  const st = statusStyle(g.status, g.status_code)
  const showScore = g.away.score != null || g.home.score != null
  return (
    <div className="bg-white rounded-lg shadow p-3 shrink-0 w-[168px]" data-testid="game-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--color-text-muted)] truncate">
          {g.stadium ?? ''} {g.start_time ?? ''}
        </span>
        <span className="text-[9px] font-bold text-white rounded px-1.5 py-0.5 shrink-0" style={{ background: st.bg }}>
          {st.label}
        </span>
      </div>
      <div className="space-y-1">
        <TeamLine team={g.away} opponent={g.home} showScore={showScore} />
        <TeamLine team={g.home} opponent={g.away} showScore={showScore} />
      </div>
      {(g.win_pitcher || g.broadcast) && (
        <p className="text-[9px] text-[var(--color-text-muted)] mt-2 pt-1.5 border-t border-[var(--color-border)] truncate">
          {g.win_pitcher ? `승 ${g.win_pitcher}${g.save_pitcher ? ` · 세 ${g.save_pitcher}` : ''}` : g.broadcast}
        </p>
      )}
    </div>
  )
}

export default function Scoreboard() {
  const [games, setGames] = useState<GameRow[]>([])
  const [gameDate, setGameDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getGames()
        if (cancelled) return
        setGames(res.data)
        setGameDate(res.game_date)
      } catch {
        if (!cancelled) setGames([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <SkeletonBlock height="120px" />
  // 경기 없는 날은 섹션 자체를 숨김 (명세)
  if (games.length === 0) return null

  return (
    <section data-testid="scoreboard-section">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">경기 일정 · 결과</h2>
        {gameDate && <span className="text-xs font-mono text-[var(--color-text-secondary)]">{gameDate}</span>}
        <span
          title="KBO 공식 게임센터에서 수집한 실제 데이터입니다."
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] cursor-help"
          data-testid="real-data-badge"
        >
          실데이터
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {games.map(g => <GameCard key={g.game_id} g={g} />)}
      </div>
    </section>
  )
}
