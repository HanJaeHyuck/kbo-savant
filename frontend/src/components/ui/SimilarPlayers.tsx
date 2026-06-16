import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSimilarPlayers } from '../../api/players'

interface SimilarRow {
  player_id: number
  name: string
  team: string
  position: string
  similarity: number
  stats: Record<string, number | null>
}

interface SimilarResponse {
  is_pitcher: boolean
  similar: SimilarRow[]
}

function simColor(s: number): string {
  if (s >= 75) return '#C0392B'
  if (s >= 60) return '#E67E22'
  if (s >= 45) return '#95A5A6'
  return '#3498DB'
}

const f3 = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(3).replace(/^0/, ''))
const f2 = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(2))
const f1 = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1))

export default function SimilarPlayers({ playerId, playerName, season }: { playerId: number; playerName: string; season: number }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SimilarResponse | null>(null)
  const [error, setError] = useState(false)

  const handleOpen = async () => {
    setOpen(true)
    if (data) return
    setLoading(true)
    setError(false)
    try {
      const res = await getSimilarPlayers(playerId, season)
      setData(res as SimilarResponse)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const go = (id: number) => {
    setOpen(false)
    navigate(`/players/${id}`)
  }

  return (
    <>
      <button onClick={handleOpen}
        className="text-[10px] px-2 py-1 rounded bg-[#EDF1F7] hover:bg-[#DDE5F0] text-[var(--color-primary-mid)] font-medium"
        data-testid="similar-players-btn">
        유사 선수
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)} data-testid="similar-players-modal">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] sticky top-0 bg-white">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">유사 선수</h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">{playerName} · {season} · 스탯 프로필 유사도</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-xs bg-[var(--color-border)] rounded px-2 py-1">닫기 ✕</button>
            </div>

            <div className="p-3">
              {loading && <p className="text-center text-sm text-[var(--color-text-muted)] py-8">불러오는 중…</p>}
              {error && <p className="text-center text-sm text-[var(--color-text-muted)] py-8">데이터를 불러오지 못했습니다.</p>}
              {data && data.similar.length === 0 && !loading && (
                <p className="text-center text-sm text-[var(--color-text-muted)] py-8">유사 선수를 찾을 수 없습니다.</p>
              )}
              {data && data.similar.length > 0 && (
                <div className="space-y-2">
                  {data.similar.map((s, i) => (
                    <button key={s.player_id} onClick={() => go(s.player_id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-[var(--color-border)] hover:bg-[#F4F6FA] text-left transition-colors">
                      <span className="text-xs font-bold text-[var(--color-text-muted)] w-4 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {s.name} <span className="text-[11px] font-normal text-[var(--color-text-secondary)]">{s.position} · {s.team}</span>
                        </p>
                        <p className="text-[11px] font-mono text-[var(--color-text-secondary)] mt-0.5">
                          {data.is_pitcher
                            ? `ERA ${f2(s.stats.era)} · FIP ${f2(s.stats.fip)} · K% ${f1(s.stats.k_pct)} · 구속 ${f1(s.stats.fastball_velo)} · WAR ${f1(s.stats.war)}`
                            : `AVG ${f3(s.stats.avg)} · OPS ${f3(s.stats.ops)} · wRC+ ${Math.round(Number(s.stats.wrc_plus ?? 0))} · HR ${s.stats.hr ?? '—'} · WAR ${f1(s.stats.war)}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <span className="text-sm font-bold font-mono" style={{ color: simColor(s.similarity) }}>{s.similarity}%</span>
                        <span className="block w-12 h-1.5 rounded-full bg-[#EDF1F7] overflow-hidden mt-0.5">
                          <span className="block h-full rounded-full" style={{ width: `${s.similarity}%`, background: simColor(s.similarity) }} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
