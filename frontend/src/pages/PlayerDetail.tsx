import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import PercentileBar from '../components/ui/PercentileBar'
import SkeletonBlock from '../components/ui/SkeletonBlock'
import ErrorMessage from '../components/ui/ErrorMessage'
import StrikeZoneMap from '../components/charts/StrikeZoneMap'
import VeloTrend from '../components/charts/VeloTrend'
import PitchMix from '../components/charts/PitchMix'
import { getPlayer, getPitchingStats, getBattingStats, getPitches, getBattedBalls } from '../api/players'
import type { ZoneData, VeloPoint, PitchType } from '../types'

interface PlayerInfo {
  id: number
  name: string
  team: string
  position: string
  throws: string
  bats: string
  birth_date?: string
}

interface PitchingData {
  season: number
  classic: { games: number; gs: number; ip: number; wins: number; losses: number; era: number }
  sabermetrics: { fip: number; xfip: number; era_minus: number; fip_minus: number; k_pct: number; bb_pct: number; babip: number; war: number }
  tracking: { avg_ev_allowed: number; hard_hit_pct: number; barrel_pct: number; csw_pct: number; whiff_pct: number; chase_pct: number }
  percentiles: Record<string, number>
}

interface PitchesData {
  total_pitches: number
  pitch_mix: PitchType[]
  zone_data: ZoneData[]
  velocity_trend: VeloPoint[]
}

interface BattingData {
  season: number
  classic: { games: number; pa: number; avg: number; obp: number; slg: number; ops: number; hr: number; rbi: number; sb: number }
  sabermetrics: { woba: number; wrc_plus: number; babip: number; war: number }
  tracking: { hard_hit_pct: number; barrel_pct: number; sweet_spot_pct: number; avg_ev: number; chase_pct: number; whiff_pct: number }
  percentiles: Record<string, number>
}

interface BattedBallsData {
  total: number
  spray_data: { spray_x: number; spray_y: number; result: string; exit_velocity: number; launch_angle: number }[]
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playerId = Number(id)
  const season = 2024

  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [pitching, setPitching] = useState<PitchingData | null>(null)
  const [batting, setBatting] = useState<BattingData | null>(null)
  const [pitches, setPitches] = useState<PitchesData | null>(null)
  const [_battedBalls, setBattedBalls] = useState<BattedBallsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!playerId) return
    setLoading(true)
    setError(null)

    getPlayer(playerId)
      .then((p: PlayerInfo) => {
        setPlayerInfo(p)
        const isPitcher = p.position === 'P'
        const promises = isPitcher
          ? [getPitchingStats(playerId, season), getPitches(playerId, season)]
          : [getBattingStats(playerId, season), getBattedBalls(playerId, season)]

        return Promise.all(promises).then(([stats, extraData]) => {
          if (isPitcher) {
            setPitching(stats as PitchingData)
            setPitches(extraData as PitchesData)
          } else {
            setBatting(stats as BattingData)
            setBattedBalls(extraData as BattedBallsData)
          }
        })
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [playerId])

  if (loading) return <LoadingState />
  if (error) return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorMessage type="not_found" onRetry={() => navigate(-1)} />
      </div>
    </div>
  )
  if (!playerInfo) return null

  const isPitcher = playerInfo.position === 'P'

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />

      {/* 선수 헤더 */}
      <div className="bg-[#0A2240] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{playerInfo.name}</h1>
            <p className="text-blue-200 text-sm">
              {playerInfo.team} · {playerInfo.position} · {playerInfo.bats}타 {playerInfo.throws}투
            </p>
          </div>
          {isPitcher && pitching && (
            <div className="flex flex-wrap gap-2 ml-auto" data-testid="pitcher-pills">
              <Pill label="ERA"  value={pitching.classic.era.toFixed(2)} />
              <Pill label="FIP"  value={pitching.sabermetrics.fip.toFixed(2)} />
              <Pill label="IP"   value={pitching.classic.ip.toFixed(1)} />
              <Pill label="WAR"  value={pitching.sabermetrics.war.toFixed(1)} accent />
            </div>
          )}
          {!isPitcher && batting && (
            <div className="flex flex-wrap gap-2 ml-auto" data-testid="batter-pills">
              <Pill label="AVG"  value={batting.classic.avg.toFixed(3).replace(/^0/, '')} />
              <Pill label="OPS"  value={batting.classic.ops.toFixed(3).replace(/^0/, '')} />
              <Pill label="HR"   value={String(batting.classic.hr)} />
              <Pill label="WAR"  value={batting.sabermetrics.war.toFixed(1)} accent />
            </div>
          )}
        </div>
      </div>

      {/* 메인 3열 레이아웃 */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-8">
        {isPitcher
          ? <PitcherView pitching={pitching} pitches={pitches} />
          : <BatterView batting={batting} />
        }
      </main>
    </div>
  )
}

/* ── 투수 뷰 ───────────────────────────────────── */
function PitcherView({ pitching, pitches }: { pitching: PitchingData | null; pitches: PitchesData | null }) {
  const [zoneMetric, setZoneMetric] = useState<'batting_avg' | 'whiff_pct'>('batting_avg')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* 좌측: 시즌 스탯 */}
      <div className="space-y-4">
        <SectionTitle>2024 시즌 스탯</SectionTitle>
        {pitching ? (
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <StatRow label="ERA"   value={pitching.classic.era.toFixed(2)} />
            <StatRow label="FIP"   value={pitching.sabermetrics.fip.toFixed(2)} />
            <StatRow label="xFIP"  value={pitching.sabermetrics.xfip.toFixed(2)} />
            <StatRow label="ERA-"  value={String(pitching.sabermetrics.era_minus)} />
            <StatRow label="IP"    value={pitching.classic.ip.toFixed(1)} />
            <StatRow label="K%"    value={`${pitching.sabermetrics.k_pct.toFixed(1)}%`} />
            <StatRow label="BB%"   value={`${pitching.sabermetrics.bb_pct.toFixed(1)}%`} />
            <StatRow label="BABIP" value={pitching.sabermetrics.babip.toFixed(3).replace(/^0/, '')} />
            <StatRow label="WAR"   value={pitching.sabermetrics.war.toFixed(1)} accent />
          </div>
        ) : <SkeletonBlock height="200px" />}

        {pitching && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">트래킹 지표</p>
            <div className="space-y-2">
              <StatRow label="CSW%"     value={`${pitching.tracking.csw_pct.toFixed(1)}%`} data-testid="stat-csw_pct" />
              <StatRow label="Whiff%"   value={`${pitching.tracking.whiff_pct.toFixed(1)}%`} data-testid="stat-whiff_pct" />
              <StatRow label="Chase%"   value={`${pitching.tracking.chase_pct.toFixed(1)}%`} data-testid="stat-chase_pct" />
              <StatRow label="허용 HH%" value={`${pitching.tracking.hard_hit_pct.toFixed(1)}%`} />
              <StatRow label="허용 EV"  value={`${pitching.tracking.avg_ev_allowed.toFixed(1)}`} />
            </div>
          </div>
        )}
      </div>

      {/* 중앙: 퍼센타일 바 */}
      <div className="space-y-4">
        <SectionTitle>퍼센타일 랭킹</SectionTitle>
        {pitching ? (
          <div className="bg-white rounded-lg shadow p-4 space-y-1" data-testid="percentile-section">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">핵심 가치 지표</p>
            <PercentileBar label="WAR"   value={pitching.sabermetrics.war.toFixed(1)}  percentile={pitching.percentiles.war ?? 50} />
            <PercentileBar label="ERA-"  value={pitching.sabermetrics.era_minus.toFixed(0)} percentile={pitching.percentiles.era_minus ?? 50} />
            <PercentileBar label="FIP"   value={pitching.sabermetrics.fip.toFixed(2)}  percentile={pitching.percentiles.fip ?? 50} invertColor />
            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">구위 지표</p>
              <PercentileBar label="CSW%"   value={`${pitching.tracking.csw_pct.toFixed(1)}%`}   percentile={pitching.percentiles.csw_pct ?? 50} />
              <PercentileBar label="Whiff%" value={`${pitching.tracking.whiff_pct.toFixed(1)}%`}  percentile={pitching.percentiles.whiff_pct ?? 50} />
              <PercentileBar label="K%"     value={`${pitching.sabermetrics.k_pct.toFixed(1)}%`}  percentile={pitching.percentiles.k_pct ?? 50} />
              <PercentileBar label="Chase%" value={`${pitching.tracking.chase_pct.toFixed(1)}%`}  percentile={pitching.percentiles.chase_pct ?? 50} />
            </div>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">허용 타구질</p>
              <PercentileBar label="허용 HH%" value={`${pitching.tracking.hard_hit_pct.toFixed(1)}%`} percentile={pitching.percentiles.hard_hit_pct ?? 50} invertColor />
              <PercentileBar label="허용 EV"  value={`${pitching.tracking.avg_ev_allowed.toFixed(1)}`} percentile={pitching.percentiles.avg_ev_allowed ?? 50} invertColor />
            </div>
          </div>
        ) : <SkeletonBlock height="300px" />}
      </div>

      {/* 우측: 차트 */}
      <div className="space-y-4">
        {pitches && pitches.pitch_mix.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <SectionTitle>구종 구성</SectionTitle>
            <PitchMix data={pitches.pitch_mix} season={2024} />
          </div>
        )}

        {pitches && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <SectionTitle>스트라이크존 히트맵</SectionTitle>
              <select
                className="text-xs border rounded px-1 py-0.5"
                value={zoneMetric}
                onChange={e => setZoneMetric(e.target.value as 'batting_avg' | 'whiff_pct')}
                data-testid="zone-metric-select"
              >
                <option value="batting_avg">피안타율</option>
                <option value="whiff_pct">Whiff%</option>
              </select>
            </div>
            <div className="flex justify-center" data-testid="zone-map-container">
              <StrikeZoneMap data={pitches.zone_data} colorBy={zoneMetric} />
            </div>
          </div>
        )}

        {pitches && pitches.velocity_trend.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <SectionTitle>구속 트렌드</SectionTitle>
            <VeloTrend data={pitches.velocity_trend} />
          </div>
        )}
      </div>

    </div>
  )
}

/* ── 타자 뷰 (Goal 10에서 완성) ─────────────────── */
function BatterView({ batting }: { batting: BattingData | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <SectionTitle>2024 시즌 스탯</SectionTitle>
        {batting ? (
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <StatRow label="AVG"   value={batting.classic.avg.toFixed(3).replace(/^0/, '')} />
            <StatRow label="OBP"   value={batting.classic.obp.toFixed(3).replace(/^0/, '')} />
            <StatRow label="SLG"   value={batting.classic.slg.toFixed(3).replace(/^0/, '')} />
            <StatRow label="OPS"   value={batting.classic.ops.toFixed(3).replace(/^0/, '')} />
            <StatRow label="wRC+"  value={String(batting.sabermetrics.wrc_plus)} />
            <StatRow label="WAR"   value={batting.sabermetrics.war.toFixed(1)} accent />
          </div>
        ) : <SkeletonBlock height="200px" />}
        {batting && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">트래킹 지표</p>
            <div className="space-y-2">
              <StatRow label="하드힛%"    value={`${batting.tracking.hard_hit_pct.toFixed(1)}%`} />
              <StatRow label="배럴%"      value={`${batting.tracking.barrel_pct.toFixed(1)}%`} />
              <StatRow label="평균 EV"    value={`${batting.tracking.avg_ev.toFixed(1)}`} />
              <StatRow label="스위트스팟%" value={`${batting.tracking.sweet_spot_pct.toFixed(1)}%`} />
              <StatRow label="Chase%"     value={`${batting.tracking.chase_pct.toFixed(1)}%`} />
              <StatRow label="Whiff%"     value={`${batting.tracking.whiff_pct.toFixed(1)}%`} />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <SectionTitle>퍼센타일 랭킹</SectionTitle>
        {batting ? (
          <div className="bg-white rounded-lg shadow p-4 space-y-1">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">생산 지표</p>
            <PercentileBar label="WAR"   value={batting.sabermetrics.war.toFixed(1)}  percentile={batting.percentiles.war ?? 50} />
            <PercentileBar label="wRC+"  value={String(batting.sabermetrics.wrc_plus)} percentile={batting.percentiles.wrc_plus ?? 50} />
            <PercentileBar label="OPS"   value={batting.classic.ops.toFixed(3).replace(/^0/, '')} percentile={batting.percentiles.ops ?? 50} />
            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">타구 질</p>
              <PercentileBar label="하드힛%"  value={`${batting.tracking.hard_hit_pct.toFixed(1)}%`}  percentile={batting.percentiles.hard_hit_pct ?? 50} />
              <PercentileBar label="배럴%"    value={`${batting.tracking.barrel_pct.toFixed(1)}%`}    percentile={batting.percentiles.barrel_pct ?? 50} />
              <PercentileBar label="평균 EV"  value={`${batting.tracking.avg_ev.toFixed(1)}`}         percentile={batting.percentiles.avg_ev ?? 50} />
            </div>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">선구안</p>
              <PercentileBar label="Chase%" value={`${batting.tracking.chase_pct.toFixed(1)}%`} percentile={batting.percentiles.chase_pct ?? 50} invertColor />
              <PercentileBar label="Whiff%" value={`${batting.tracking.whiff_pct.toFixed(1)}%`} percentile={batting.percentiles.whiff_pct ?? 50} invertColor />
            </div>
          </div>
        ) : <SkeletonBlock height="300px" />}
      </div>

      <div className="space-y-4">
        <SectionTitle>타구 데이터</SectionTitle>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center h-40 text-sm text-[var(--color-text-muted)]">
          스프레이 차트 (Goal 10에서 구현)
        </div>
      </div>
    </div>
  )
}

/* ── 공통 UI 헬퍼 ─────────────────────────────── */
function Pill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center bg-white/10 rounded px-3 py-1">
      <span className="text-[10px] text-blue-200">{label}</span>
      <span className={`text-sm font-bold font-mono ${accent ? 'text-yellow-300' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function StatRow({ label, value, accent, 'data-testid': testid }: { label: string; value: string; accent?: boolean; 'data-testid'?: string }) {
  return (
    <div className="flex justify-between items-center" data-testid={testid}>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <span className={`text-sm font-mono font-bold ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">{children}</h2>
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />
      <div className="bg-[#0A2240] h-16 animate-pulse" />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <SkeletonBlock key={i} height="300px" />)}
        </div>
      </main>
    </div>
  )
}
