import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NavBar from '../components/ui/NavBar'
import PercentileBar from '../components/ui/PercentileBar'
import SkeletonBlock from '../components/ui/SkeletonBlock'
import ErrorMessage from '../components/ui/ErrorMessage'
import StrikeZoneMap from '../components/charts/StrikeZoneMap'
import VeloTrend from '../components/charts/VeloTrend'
import PitchMix from '../components/charts/PitchMix'
import SprayChart from '../components/charts/SprayChart'
import RadarChart from '../components/charts/RadarChart'
import PitchZoneMap from '../components/charts/PitchZoneMap'
import PitchCountBreakdown from '../components/charts/PitchCountBreakdown'
import MovementProfile from '../components/charts/MovementProfile'
import ZoneHeatmapGrid from '../components/charts/ZoneHeatmapGrid'
import CareerSplitsTable from '../components/tables/CareerSplitsTable'
import PitchArsenalTable from '../components/tables/PitchArsenalTable'
import SimilarPlayers from '../components/ui/SimilarPlayers'
import {
  getPlayer, getPitchingStats, getBattingStats, getPitches, getBattedBalls,
  getCareerBatting, getCareerPitching, getPitchArsenal,
} from '../api/players'
import type { ZoneData, VeloPoint, PitchType, SprayData, PitchLocation, PitchCountRow, CareerRow, MovementPoint, ZoneGridCell, PitchArsenalRow } from '../types'

interface PlayerInfo {
  id: number
  name: string
  team: string
  position: string
  throws: string
  bats: string
  birth_date?: string
  height?: string
  weight?: string
  draft?: string
  school?: string
}

interface PitchingData {
  season: number
  classic: { games: number; gs: number; ip: number; wins: number; losses: number; era: number }
  sabermetrics: { fip: number; xfip: number; era_minus: number; fip_minus: number; k_pct: number; bb_pct: number; babip: number; war: number }
  tracking: { avg_ev_allowed: number; hard_hit_pct: number; barrel_pct: number; csw_pct: number; whiff_pct: number; chase_pct: number; gb_pct?: number | null; fastball_velo?: number | null; xera?: number | null; allowed_xba?: number | null; arm_angle?: number | null }
  run_value: { pitching_rv: number; fastball_rv: number; breaking_rv: number; offspeed_rv: number }
  percentiles: Record<string, number>
}

interface PitchesData {
  total_pitches: number
  pitch_mix: PitchType[]
  zone_data: ZoneData[]
  zone_grid: ZoneGridCell[]
  velocity_trend: VeloPoint[]
  locations: PitchLocation[]
  count_breakdown: PitchCountRow[]
  movement: MovementPoint[]
  usage_splits: { L: { pitch_type: string; pct: number }[]; R: { pitch_type: string; pct: number }[] }
}

interface BattingData {
  season: number
  classic: { games: number; pa: number; avg: number; obp: number; slg: number; ops: number; hr: number; rbi: number; sb: number }
  sabermetrics: { woba: number; wrc_plus: number; babip: number; war: number }
  tracking: { hard_hit_pct: number; barrel_pct: number; sweet_spot_pct: number; avg_ev: number; chase_pct: number; whiff_pct: number; xba?: number | null; xslg?: number | null; xwoba?: number | null }
  percentiles: Record<string, number>
}

interface ZoneAvg { zone: number; avg: number; attempts: number }
interface BattedBallsData { total: number; spray_data: SprayData[]; zone_avg?: ZoneAvg[] }

const TOOLTIPS: Record<string, string> = {
  WAR: '대체 선수 대비 기여 승수',
  'ERA-': '리그 평균 대비 ERA (100=평균, 낮을수록 우수)',
  'FIP-': '리그 평균 대비 FIP (100=평균, 낮을수록 우수)',
  FIP: '수비 무관 평균자책 (낮을수록 우수)',
  'CSW%': '헛스윙 + 루킹 스트라이크 비율',
  'Whiff%': '스윙 대비 헛스윙 비율',
  'K%': '삼진 비율',
  'Chase%': '존 바깥 스윙 비율 (낮을수록 우수)',
  '허용 HH%': '허용 타구 중 강한 타구(150km/h+) 비율 (낮을수록 우수)',
  '허용 EV': '허용 평균 타구속도 (낮을수록 우수)',
  'wRC+': '조정 득점 생산력 (100=리그 평균)',
  OPS: '출루율 + 장타율',
  '하드힛%': '강한 타구(150km/h 이상) 비율',
  '배럴%': '최적 타구(타구속도+발사각) 비율',
  '평균 EV': '평균 타구속도',
  BABIP: '인플레이 타구 타율 (운/타구질 성분)',
  '허용 Barrel%': '허용 타구 중 배럴 비율 (낮을수록 우수)',
  'BB%': '볼넷 허용 비율 (낮을수록 우수)',
  '허용 BABIP': '인플레이 허용 타율 (낮을수록 우수)',
  xBA: '타구속도+발사각 기반 기대 타율 (KBO 자체 모델)',
  xSLG: '타구속도+발사각 기반 기대 장타율',
  xwOBA: '타구속도+발사각 기반 기대 wOBA',
  xERA: '허용 타구질 기반 기대 ERA (낮을수록 우수)',
  '허용 xBA': '허용 타구질 기반 기대 피안타율 (낮을수록 우수)',
  'Fastball Velo': '포심 평균 구속 (높을수록 우수)',
  'GB%': '땅볼 비율 (높을수록 우수 — 장타 억제)',
  'Pitching RV': '볼카운트 기반 투구 득점 기여 (Context-Neutral, 높을수록 우수)',
  'Fastball RV': '패스트볼 계열 Run Value',
  'Breaking RV': '브레이킹 계열 Run Value',
  'Offspeed RV': '오프스피드 계열 Run Value',
}

// null 허용 수치 포맷
const fx = (v: number | null | undefined, digits = 3) =>
  v == null ? '—' : v.toFixed(digits).replace(/^0/, '')
const frv = (v: number | null | undefined) =>
  v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1)

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playerId = Number(id)

  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [career, setCareer] = useState<CareerRow[]>([])
  const [selectedYear, setSelectedYear] = useState(2024)
  const [pitching, setPitching] = useState<PitchingData | null>(null)
  const [batting, setBatting] = useState<BattingData | null>(null)
  const [pitches, setPitches] = useState<PitchesData | null>(null)
  const [arsenal, setArsenal] = useState<PitchArsenalRow[]>([])
  const [battedBalls, setBattedBalls] = useState<BattedBallsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 선수 기본 정보 + 커리어 (연도 목록)
  useEffect(() => {
    if (!playerId) return
    let cancelled = false
    async function loadPlayer() {
      setLoading(true)
      setError(null)
      try {
        const p = await getPlayer(playerId)
        if (cancelled) return
        setPlayerInfo(p)
        // 커리어는 보조 데이터 — 실패해도 페이지 전체를 막지 않음
        try {
          const careerData = p.position === 'P'
            ? await getCareerPitching(playerId)
            : await getCareerBatting(playerId)
          if (cancelled) return
          const rows: CareerRow[] = careerData?.data ?? []
          setCareer(rows)
          if (rows.length > 0) setSelectedYear(Math.max(...rows.map(r => r.season)))
        } catch {
          if (!cancelled) setCareer([])
        }
      } catch (e) {
        if (!cancelled) setError(e as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPlayer()
    return () => { cancelled = true }
  }, [playerId])

  // 선택 연도 시즌 데이터 (연도 클릭 시 갱신)
  useEffect(() => {
    if (!playerId || !playerInfo) return
    let cancelled = false
    const isPitcher = playerInfo.position === 'P'
    async function loadSeason() {
      try {
        if (isPitcher) {
          const [stats, pd] = await Promise.all([
            getPitchingStats(playerId, selectedYear),
            getPitches(playerId, selectedYear),
          ])
          if (cancelled) return
          setPitching(stats as PitchingData)
          setPitches(pd as PitchesData)
        } else {
          const [stats, bb] = await Promise.all([
            getBattingStats(playerId, selectedYear),
            getBattedBalls(playerId, selectedYear),
          ])
          if (cancelled) return
          setBatting(stats as BattingData)
          setBattedBalls(bb as BattedBallsData)
        }
      } catch {
        // 시즌 데이터 없음 — 빈 상태로 둠
      }
    }
    loadSeason()
    return () => { cancelled = true }
  }, [playerId, selectedYear, playerInfo])

  // 구종별 트래킹 테이블 (커리어 전체, 시즌 무관 1회 로드)
  useEffect(() => {
    if (!playerId || !playerInfo || playerInfo.position !== 'P') return
    let cancelled = false
    getPitchArsenal(playerId)
      .then(d => { if (!cancelled) setArsenal(d?.rows ?? []) })
      .catch(() => { if (!cancelled) setArsenal([]) })
    return () => { cancelled = true }
  }, [playerId, playerInfo])

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

      {/* 선수 헤더 밴드 */}
      <div className="bg-[#0A2240] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              {playerInfo.name}
              <span className="text-xs font-normal bg-white/15 rounded px-1.5 py-0.5">{playerInfo.position}</span>
            </h1>
            <p className="text-blue-200 text-sm">
              {playerInfo.team} · {playerInfo.bats}타 {playerInfo.throws}투
              {playerInfo.birth_date ? ` · ${playerInfo.birth_date}` : ''}
            </p>
          </div>

          {isPitcher && pitching && (
            <div className="flex flex-wrap gap-2" data-testid="pitcher-pills">
              <Pill label="ERA" value={pitching.classic.era.toFixed(2)} />
              <Pill label="FIP" value={pitching.sabermetrics.fip.toFixed(2)} />
              <Pill label="IP" value={pitching.classic.ip.toFixed(1)} />
              <Pill label="WAR" value={pitching.sabermetrics.war.toFixed(1)} accent />
            </div>
          )}
          {!isPitcher && batting && (
            <div className="flex flex-wrap gap-2" data-testid="batter-pills">
              <Pill label="AVG" value={batting.classic.avg.toFixed(3).replace(/^0/, '')} />
              <Pill label="OPS" value={batting.classic.ops.toFixed(3).replace(/^0/, '')} />
              <Pill label="HR" value={String(batting.classic.hr)} />
              <Pill label="WAR" value={batting.sabermetrics.war.toFixed(1)} accent />
            </div>
          )}

          <button
            onClick={() => navigate('/compare')}
            className="ml-auto text-xs bg-white/15 hover:bg-white/25 rounded px-3 py-1.5 transition-colors"
            data-testid="add-compare-btn"
          >
            + 비교 추가
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-8 space-y-6">
        {/* 히어로 3열: 사진+정보 | 퍼센타일 | 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

          {/* 좌측: 선수 사진 + 바이오 + 커리어표 + 구종 사용률 + 트래킹 */}
          <div className="space-y-3 min-w-0">
            <PlayerHeroCard info={playerInfo} career={career} isPitcher={isPitcher} />
            {isPitcher && <PitchUsageTable pitches={pitches} season={selectedYear} onNav={navigate} playerId={playerId} playerName={playerInfo.name} />}
            {!isPitcher && (
              <div className="bg-white rounded-lg shadow p-3" data-testid="batter-player-apps">
                <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">Player Apps</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => navigate('/compare')}
                    className="text-[10px] px-2 py-1 rounded bg-[#EDF1F7] hover:bg-[#DDE5F0] text-[var(--color-primary-mid)] font-medium">
                    선수 비교
                  </button>
                  <SimilarPlayers playerId={playerId} playerName={playerInfo.name} season={selectedYear} />
                </div>
              </div>
            )}
            {isPitcher && pitching && (
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">{selectedYear} 트래킹 지표</p>
                <div className="space-y-2">
                  <StatRow label="CSW%" value={`${pitching.tracking.csw_pct.toFixed(1)}%`} data-testid="stat-csw_pct" />
                  <StatRow label="Whiff%" value={`${pitching.tracking.whiff_pct.toFixed(1)}%`} data-testid="stat-whiff_pct" />
                  <StatRow label="Chase%" value={`${pitching.tracking.chase_pct.toFixed(1)}%`} data-testid="stat-chase_pct" />
                  <StatRow label="허용 HH%" value={`${pitching.tracking.hard_hit_pct.toFixed(1)}%`} />
                  <StatRow label="허용 EV" value={`${pitching.tracking.avg_ev_allowed.toFixed(1)}`} />
                </div>
              </div>
            )}
            {isPitcher && pitches && (
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">볼카운트별 구종</p>
                <PitchCountBreakdown data={pitches.count_breakdown} />
              </div>
            )}
            {!isPitcher && batting && (
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">{selectedYear} 트래킹 지표</p>
                <div className="space-y-2" data-testid="tracking-stats">
                  <StatRow label="하드힛%" value={`${batting.tracking.hard_hit_pct.toFixed(1)}%`} data-testid="stat-hard_hit_pct" />
                  <StatRow label="배럴%" value={`${batting.tracking.barrel_pct.toFixed(1)}%`} data-testid="stat-barrel_pct" />
                  <StatRow label="평균 EV" value={`${batting.tracking.avg_ev.toFixed(1)}`} data-testid="stat-avg_ev" />
                  <StatRow label="스위트스팟%" value={`${batting.tracking.sweet_spot_pct.toFixed(1)}%`} />
                  <StatRow label="Chase%" value={`${batting.tracking.chase_pct.toFixed(1)}%`} />
                  <StatRow label="Whiff%" value={`${batting.tracking.whiff_pct.toFixed(1)}%`} />
                </div>
              </div>
            )}
          </div>

          {/* 중앙: 퍼센타일 랭킹 */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <SectionTitle>퍼센타일 랭킹</SectionTitle>
              <span className="text-xs font-mono bg-[#0A2240] text-white rounded px-2 py-0.5">{selectedYear}</span>
            </div>
            {isPitcher
              ? <PitcherPercentiles pitching={pitching} />
              : <BatterPercentiles batting={batting} />}
          </div>

          {/* 우측: 핵심 차트 (투수: 무브먼트+구종구성 / 타자: 스프레이+레이더) */}
          <div className="space-y-4 min-w-0">
            {isPitcher
              ? <PitcherHeroCharts pitches={pitches} armAngle={pitching?.tracking.arm_angle} />
              : <BatterHeroCharts battedBalls={battedBalls} batting={batting} />}
          </div>
        </div>

        {/* 전체너비: 연도별 커리어 스탯 */}
        <div className="space-y-2">
          <SectionTitle>연도별 커리어 스탯 <span className="text-[11px] font-normal text-[var(--color-text-muted)]">— 연도 클릭 시 위/아래 전부 갱신</span></SectionTitle>
          <CareerSplitsTable
            data={career}
            type={isPitcher ? 'pitcher' : 'batter'}
            selectedYear={selectedYear}
            onYearSelect={setSelectedYear}
          />
        </div>

        {/* 전체너비: 상세 차트 그리드 */}
        {isPitcher
          ? <PitcherChartGrid pitches={pitches} />
          : <BatterChartGrid battedBalls={battedBalls} />}

        {/* 전체너비: 구종별 트래킹 테이블 (투수) */}
        {isPitcher && arsenal.length > 0 && (
          <div className="space-y-2">
            <SectionTitle>구종별 트래킹 (Pitch Tracking) <span className="text-[11px] font-normal text-[var(--color-text-muted)]">— 연도 × 구종 상세 + 허용 타구질</span></SectionTitle>
            <PitchArsenalTable rows={arsenal} />
          </div>
        )}
      </main>
    </div>
  )
}

/* ── 투수 퍼센타일 ──────────────────────────────── */
function PitcherPercentiles({ pitching }: { pitching: PitchingData | null }) {
  if (!pitching) return <SkeletonBlock height="320px" />
  const pc = pitching.percentiles
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-1" data-testid="percentile-section">
      <PercentileScale />
      <SectionHeader icon="🏆" title="가치 (Value)" />
      <PercentileBar label="Pitching RV" value={frv(pitching.run_value?.pitching_rv)} percentile={pc.pitching_rv ?? 50} tooltip={TOOLTIPS['Pitching RV']} />
      <PercentileBar label="Fastball RV" value={frv(pitching.run_value?.fastball_rv)} percentile={pc.fastball_rv ?? 50} tooltip={TOOLTIPS['Fastball RV']} />
      <PercentileBar label="Breaking RV" value={frv(pitching.run_value?.breaking_rv)} percentile={pc.breaking_rv ?? 50} tooltip={TOOLTIPS['Breaking RV']} />
      <PercentileBar label="Offspeed RV" value={frv(pitching.run_value?.offspeed_rv)} percentile={pc.offspeed_rv ?? 50} tooltip={TOOLTIPS['Offspeed RV']} />
      <PercentileBar label="WAR" value={pitching.sabermetrics.war.toFixed(1)} percentile={pc.war ?? 50} tooltip={TOOLTIPS.WAR} />
      <PercentileBar label="ERA-" value={pitching.sabermetrics.era_minus.toFixed(0)} percentile={pc.era_minus ?? 50} tooltip={TOOLTIPS['ERA-']} />
      <PercentileBar label="FIP" value={pitching.sabermetrics.fip.toFixed(2)} percentile={pc.fip ?? 50} tooltip={TOOLTIPS.FIP} />
      <Divider />
      <SectionHeader icon="⚾" title="투구 (Pitching)" />
      <PercentileBar label="xERA" value={fx(pitching.tracking.xera, 2)} percentile={pc.xera ?? 50} tooltip={TOOLTIPS.xERA} />
      <PercentileBar label="허용 xBA" value={fx(pitching.tracking.allowed_xba)} percentile={pc.allowed_xba ?? 50} tooltip={TOOLTIPS['허용 xBA']} />
      <PercentileBar label="Fastball Velo" value={pitching.tracking.fastball_velo != null ? `${pitching.tracking.fastball_velo.toFixed(1)}` : '—'} percentile={pc.fastball_velo ?? 50} tooltip={TOOLTIPS['Fastball Velo']} />
      <PercentileBar label="허용 EV" value={`${pitching.tracking.avg_ev_allowed.toFixed(1)}`} percentile={pc.avg_ev_allowed ?? 50} tooltip={TOOLTIPS['허용 EV']} />
      <PercentileBar label="CSW%" value={`${pitching.tracking.csw_pct.toFixed(1)}%`} percentile={pc.csw_pct ?? 50} tooltip={TOOLTIPS['CSW%']} />
      <PercentileBar label="Whiff%" value={`${pitching.tracking.whiff_pct.toFixed(1)}%`} percentile={pc.whiff_pct ?? 50} tooltip={TOOLTIPS['Whiff%']} />
      <PercentileBar label="K%" value={`${pitching.sabermetrics.k_pct.toFixed(1)}%`} percentile={pc.k_pct ?? 50} tooltip={TOOLTIPS['K%']} />
      <PercentileBar label="Chase%" value={`${pitching.tracking.chase_pct.toFixed(1)}%`} percentile={pc.chase_pct ?? 50} tooltip={TOOLTIPS['Chase%']} />
      <PercentileBar label="BB%" value={`${pitching.sabermetrics.bb_pct.toFixed(1)}%`} percentile={pc.bb_pct ?? 50} tooltip={TOOLTIPS['BB%']} />
      <PercentileBar label="허용 Barrel%" value={`${pitching.tracking.barrel_pct.toFixed(1)}%`} percentile={pc.barrel_pct ?? 50} tooltip={TOOLTIPS['허용 Barrel%']} />
      <PercentileBar label="허용 HH%" value={`${pitching.tracking.hard_hit_pct.toFixed(1)}%`} percentile={pc.hard_hit_pct ?? 50} tooltip={TOOLTIPS['허용 HH%']} />
      <PercentileBar label="GB%" value={pitching.tracking.gb_pct != null ? `${pitching.tracking.gb_pct.toFixed(1)}%` : '—'} percentile={pc.gb_pct ?? 50} tooltip={TOOLTIPS['GB%']} />
    </div>
  )
}

/* ── 타자 퍼센타일 ──────────────────────────────── */
const RADAR_STATS = ['WAR', 'wRC+', '하드힛%', '배럴%', '평균EV', 'Chase%']

function BatterPercentiles({ batting }: { batting: BattingData | null }) {
  if (!batting) return <SkeletonBlock height="320px" />
  const pc = batting.percentiles
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-1" data-testid="batter-percentile-section">
        <PercentileScale />
        <SubLabel>생산 지표</SubLabel>
        <PercentileBar label="WAR" value={batting.sabermetrics.war.toFixed(1)} percentile={pc.war ?? 50} tooltip={TOOLTIPS.WAR} />
        <PercentileBar label="wRC+" value={String(batting.sabermetrics.wrc_plus)} percentile={pc.wrc_plus ?? 50} tooltip={TOOLTIPS['wRC+']} />
        <PercentileBar label="OPS" value={batting.classic.ops.toFixed(3).replace(/^0/, '')} percentile={pc.ops ?? 50} tooltip={TOOLTIPS.OPS} />
        <PercentileBar label="BABIP" value={batting.sabermetrics.babip.toFixed(3).replace(/^0/, '')} percentile={pc.babip ?? 50} tooltip={TOOLTIPS.BABIP} />
        <Divider />
        <SubLabel>타구 질</SubLabel>
        <PercentileBar label="하드힛%" value={`${batting.tracking.hard_hit_pct.toFixed(1)}%`} percentile={pc.hard_hit_pct ?? 50} tooltip={TOOLTIPS['하드힛%']} />
        <PercentileBar label="배럴%" value={`${batting.tracking.barrel_pct.toFixed(1)}%`} percentile={pc.barrel_pct ?? 50} tooltip={TOOLTIPS['배럴%']} />
        <PercentileBar label="평균 EV" value={`${batting.tracking.avg_ev.toFixed(1)}`} percentile={pc.avg_ev ?? 50} tooltip={TOOLTIPS['평균 EV']} />
        <PercentileBar label="xBA" value={fx(batting.tracking.xba)} percentile={pc.xba ?? 50} tooltip={TOOLTIPS.xBA} />
        <PercentileBar label="xwOBA" value={fx(batting.tracking.xwoba)} percentile={pc.xwoba ?? 50} tooltip={TOOLTIPS.xwOBA} />
        <Divider />
        <SubLabel>선구안</SubLabel>
        <PercentileBar label="Chase%" value={`${batting.tracking.chase_pct.toFixed(1)}%`} percentile={pc.chase_pct ?? 50} tooltip={TOOLTIPS['Chase%']} />
        <PercentileBar label="Whiff%" value={`${batting.tracking.whiff_pct.toFixed(1)}%`} percentile={pc.whiff_pct ?? 50} tooltip={TOOLTIPS['Whiff%']} />
    </div>
  )
}

const PT_COLOR: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777', 기타: '#9CA3AF',
}
const PT_ABBR: Record<string, string> = {
  직구: 'FF', 포심: 'FF', 슬라이더: 'SL', 체인지업: 'CH',
  커브: 'CU', 커터: 'FC', 싱커: 'SI', 스플리터: 'FS', 기타: '–',
}
const nf = (v: number | null | undefined, d: number) => (v == null ? '-' : v.toFixed(d))

/* ── 좌측 히어로 카드: 사진 + 바이오 + 커리어표 ──── */
function PlayerHeroCard({ info, career, isPitcher }: { info: PlayerInfo; career: CareerRow[]; isPitcher: boolean }) {
  const age = info.birth_date ? 2026 - Number(info.birth_date.slice(0, 4)) : null
  const rows = [...career].sort((a, b) => b.season - a.season)
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="player-hero-card">
      {/* 사진 배너 */}
      <div className="bg-gradient-to-b from-[#0A2240] to-[#13315C] flex flex-col items-center pt-5 pb-3" data-testid="player-photo">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle cx="46" cy="46" r="46" fill="#13315C" />
          <circle cx="46" cy="35" r="16" fill="#9DB2D6" />
          <path d="M16 86 Q46 54 76 86 Z" fill="#9DB2D6" />
        </svg>
      </div>
      {/* 이름 + 바이오 */}
      <div className="px-3 pt-2.5 pb-2 text-center">
        <p className="text-lg font-bold text-[var(--color-text-primary)]">{info.name}</p>
        <p className="text-xs text-[var(--color-text-secondary)] font-semibold">{info.position} | {info.team}</p>
        <div className="space-y-0.5 text-[11px] text-[var(--color-text-secondary)] leading-relaxed mt-1.5">
          <p>Bats/Throws: {info.bats ?? '-'}/{info.throws ?? '-'}{info.height || info.weight ? ` | ${info.height ?? ''} ${info.weight ?? ''}`.trimEnd() : ''}{age ? ` | Age: ${age}` : ''}</p>
          {info.draft && <p>Draft: {info.draft}</p>}
          {info.school && <p>{info.school}</p>}
        </div>
      </div>
      {/* 커리어 테이블 */}
      {rows.length > 0 && (
        isPitcher ? <PitcherCareerMini rows={rows} /> : <BatterCareerMini rows={rows} />
      )}
    </div>
  )
}

const PCOL = ['W', 'L', 'ERA', 'G', 'GS', 'SV', 'IP', 'SO', 'WHIP']
function PitcherCareerMini({ rows }: { rows: CareerRow[] }) {
  // 통산 합계
  const sum = (k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0)
  const ipT = sum('ip')
  const eraT = ipT > 0 ? rows.reduce((a, r) => a + (Number(r.era) || 0) * (Number(r.ip) || 0), 0) / ipT : 0
  const whipT = ipT > 0 ? rows.reduce((a, r) => a + (Number(r.whip) || 0) * (Number(r.ip) || 0), 0) / ipT : 0
  const cell = (r: CareerRow) => [
    r.wins, r.losses, nf(r.era as number, 2), r.games, r.gs, r.saves, nf(r.ip as number, 1), r.so, nf(r.whip as number, 2),
  ]
  const total = [sum('wins'), sum('losses'), eraT.toFixed(2), sum('games'), sum('gs'), sum('saves'), ipT.toFixed(1), sum('so'), whipT.toFixed(2)]
  return (
    <div className="overflow-x-auto border-t border-[var(--color-border)]">
      <table className="w-full min-w-max font-mono text-[10px]">
        <thead>
          <tr className="text-[var(--color-text-muted)] bg-[#F4F6FA]">
            <th className="text-left font-normal px-2 py-1">시즌</th>
            {PCOL.map(c => <th key={c} className="font-normal px-1.5 py-1 text-right">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.season} className="text-[var(--color-text-primary)] border-t border-[#EEF2F7]">
              <td className="text-left px-2 py-0.5">{r.season}</td>
              {cell(r).map((v, i) => <td key={i} className="px-1.5 py-0.5 text-right">{v ?? '-'}</td>)}
            </tr>
          ))}
          <tr className="font-bold text-[var(--color-text-primary)] border-t-2 border-[#CBD5E1] bg-[#F4F6FA]">
            <td className="text-left px-2 py-0.5">{rows.length}시즌</td>
            {total.map((v, i) => <td key={i} className="px-1.5 py-0.5 text-right">{v}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const BCOL = ['AVG', 'HR', 'RBI', 'OPS', 'wRC+', 'WAR']
function BatterCareerMini({ rows }: { rows: CareerRow[] }) {
  const cell = (r: CareerRow) => [
    nf(r.avg as number, 3).replace(/^0/, ''), r.hr, r.rbi,
    nf(r.ops as number, 3).replace(/^0/, ''), r.wrc_plus, nf(r.war as number, 1),
  ]
  return (
    <div className="overflow-x-auto border-t border-[var(--color-border)]">
      <table className="w-full min-w-max font-mono text-[10px]">
        <thead>
          <tr className="text-[var(--color-text-muted)] bg-[#F4F6FA]">
            <th className="text-left font-normal px-2 py-1">시즌</th>
            {BCOL.map(c => <th key={c} className="font-normal px-1.5 py-1 text-right">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.season} className="text-[var(--color-text-primary)] border-t border-[#EEF2F7]">
              <td className="text-left px-2 py-0.5">{r.season}</td>
              {cell(r).map((v, i) => <td key={i} className="px-1.5 py-0.5 text-right">{v ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Pitch Usage (vs 좌/우 + 구종) + Player Apps ──── */
function UsageBar({ pct, side }: { pct: number; side: 'L' | 'R' }) {
  const align = side === 'L' ? 'justify-end' : 'justify-start'
  return (
    <div className={`flex items-center ${align} gap-1`}>
      {side === 'L' && <span className="text-[10px] font-mono text-[var(--color-text-secondary)] w-7 text-right">{pct}%</span>}
      <span className="h-2.5 bg-[#EDF1F7] rounded-full overflow-hidden" style={{ width: 42 }}>
        <span className={`block h-full bg-[#94A3B8] ${side === 'L' ? 'ml-auto' : ''}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      {side === 'R' && <span className="text-[10px] font-mono text-[var(--color-text-secondary)] w-7">{pct}%</span>}
    </div>
  )
}

function PitchUsageTable({ pitches, season, onNav, playerId, playerName }: { pitches: PitchesData | null; season: number; onNav: (to: string) => void; playerId: number; playerName: string }) {
  if (!pitches) return null
  const mix = [...(pitches.pitch_mix ?? [])].sort((a, b) => b.pct - a.pct)
  const lMap = new Map((pitches.usage_splits?.L ?? []).map(r => [r.pitch_type, r.pct]))
  const rMap = new Map((pitches.usage_splits?.R ?? []).map(r => [r.pitch_type, r.pct]))
  return (
    <div className="bg-white rounded-lg shadow p-3" data-testid="pitch-usage-table">
      <p className="text-xs font-bold text-[var(--color-text-primary)] mb-2">{season} Pitch Usage</p>
      <div className="grid items-center text-[10px] text-[var(--color-text-muted)] mb-1"
        style={{ gridTemplateColumns: '1fr 1.3fr 1fr' }}>
        <span className="text-center">vs 좌타</span>
        <span className="text-center">구종</span>
        <span className="text-center">vs 우타</span>
      </div>
      <div className="space-y-1.5">
        {mix.map(pt => (
          <div key={pt.pitch_type} className="grid items-center" style={{ gridTemplateColumns: '1fr 1.3fr 1fr' }}>
            <UsageBar pct={lMap.get(pt.pitch_type) ?? 0} side="L" />
            <div className="flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold text-white shrink-0"
                style={{ background: PT_COLOR[pt.pitch_type] ?? '#9CA3AF' }}>{PT_ABBR[pt.pitch_type] ?? '–'}</span>
              <span className="text-[11px] font-mono font-semibold text-[var(--color-text-primary)]">{pt.pct.toFixed(0)}%</span>
            </div>
            <UsageBar pct={rMap.get(pt.pitch_type) ?? 0} side="R" />
          </div>
        ))}
      </div>

      {/* Player Apps */}
      <div className="border-t border-[var(--color-border)] mt-3 pt-2">
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">Player Apps</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onNav('/compare')}
            className="text-[10px] px-2 py-1 rounded bg-[#EDF1F7] hover:bg-[#DDE5F0] text-[var(--color-primary-mid)] font-medium">
            선수 비교
          </button>
          <button onClick={() => document.querySelector('[data-testid="pitch-arsenal-table"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="text-[10px] px-2 py-1 rounded bg-[#EDF1F7] hover:bg-[#DDE5F0] text-[var(--color-primary-mid)] font-medium">
            구종 트래킹 ↓
          </button>
          <SimilarPlayers playerId={playerId} playerName={playerName} season={season} />
        </div>
      </div>
    </div>
  )
}

/* ── 투수 히어로 차트 (Movement Profile + 구종 구성) ── */
function PitcherHeroCharts({ pitches, armAngle }: { pitches: PitchesData | null; armAngle?: number | null }) {
  if (!pitches) return <SkeletonBlock height="600px" />
  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <SectionTitle>Movement Profile <span className="text-[11px] font-normal text-[var(--color-text-muted)]">— 구종별 수평×수직 무브먼트</span></SectionTitle>
        <MovementProfile data={pitches.movement} armAngle={armAngle} />
      </div>
      {pitches.pitch_mix.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <SectionTitle>구종 구성</SectionTitle>
          <PitchMix data={pitches.pitch_mix} season={2024} />
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-4">
        <SectionTitle>구속 트렌드 <span className="text-[11px] font-normal text-[var(--color-text-muted)]">— 구종별</span></SectionTitle>
        <VeloTrend data={pitches.velocity_trend} />
      </div>
    </>
  )
}

/* ── 타자 히어로 차트 (스프레이 + 레이더) ──────────── */
function BatterHeroCharts({ battedBalls, batting }: { battedBalls: BattedBallsData | null; batting: BattingData | null }) {
  const [sprayColorBy, setSprayColorBy] = useState<'result' | 'exit_velocity'>('result')
  const pc = batting?.percentiles ?? {}
  const radarPlayers = batting ? [{
    name: '퍼센타일',
    data: {
      WAR: pc.war ?? 50, 'wRC+': pc.wrc_plus ?? 50, '하드힛%': pc.hard_hit_pct ?? 50,
      '배럴%': pc.barrel_pct ?? 50, '평균EV': pc.avg_ev ?? 50, 'Chase%': pc.chase_pct ?? 50,
    },
  }] : []
  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>스프레이 차트</SectionTitle>
          <select className="text-xs border rounded px-1 py-0.5" value={sprayColorBy}
            onChange={e => setSprayColorBy(e.target.value as 'result' | 'exit_velocity')} data-testid="spray-color-select">
            <option value="result">결과별</option>
            <option value="exit_velocity">타구속도</option>
          </select>
        </div>
        <div className="flex justify-center" data-testid="spray-chart-container">
          <SprayChart data={battedBalls?.spray_data ?? []} colorBy={sprayColorBy} />
        </div>
      </div>
      {radarPlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <SectionTitle>레이더 차트</SectionTitle>
          <RadarChart players={radarPlayers} stats={RADAR_STATS} />
        </div>
      )}
    </>
  )
}

/* ── 투수 하단 차트 그리드 (구속/탄착군/존/볼카운트) ── */
function PitcherChartGrid({ pitches }: { pitches: PitchesData | null }) {
  const [zoneMetric, setZoneMetric] = useState<'batting_avg' | 'whiff_pct'>('batting_avg')
  if (!pitches) return <SkeletonBlock height="300px" />
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-4">
        <SectionTitle>투구 탄착군 <span className="text-[11px] font-normal text-[var(--color-text-muted)]">— 밀도</span></SectionTitle>
        <div className="flex justify-center" data-testid="pitch-zone-container">
          <PitchZoneMap data={pitches.locations} />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>스트라이크존 히트맵 <span className="text-[11px] font-normal text-[var(--color-text-muted)]">— 위치별 밀도</span></SectionTitle>
          <select className="text-xs border rounded px-1 py-0.5" value={zoneMetric}
            onChange={e => setZoneMetric(e.target.value as 'batting_avg' | 'whiff_pct')} data-testid="zone-metric-select">
            <option value="batting_avg">피안타율</option>
            <option value="whiff_pct">Whiff%</option>
          </select>
        </div>
        <div className="flex justify-center" data-testid="zone-map-container">
          <ZoneHeatmapGrid data={pitches.zone_grid} metric={zoneMetric} />
        </div>
      </div>
    </div>
  )
}

/* ── 타자 하단 차트 그리드 (존별 히트맵) ──────────── */
function BatterChartGrid({ battedBalls }: { battedBalls: BattedBallsData | null }) {
  const zoneData: ZoneData[] = battedBalls?.zone_avg?.map(z => ({
    zone: z.zone, pitches: z.attempts, batting_avg: z.avg, whiff_pct: 0,
  })) ?? []
  if (zoneData.length === 0) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-4">
        <SectionTitle>존별 타율 히트맵</SectionTitle>
        <div className="flex justify-center" data-testid="batter-zone-map-container">
          <StrikeZoneMap data={zoneData} colorBy="batting_avg" />
        </div>
      </div>
    </div>
  )
}

/* ── 공통 UI 헬퍼 ─────────────────────────────── */
function PercentileScale() {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] font-semibold mb-0.5">
        <span className="text-[#1E3A8A]">◀ POOR</span>
        <span className="text-[var(--color-text-muted)]">AVERAGE</span>
        <span className="text-[#C0392B]">GREAT ▶</span>
      </div>
      <div
        className="h-2 rounded-full"
        style={{ background: 'linear-gradient(to right,#1E3A8A,#3498DB,#95A5A6,#E67E22,#C0392B)' }}
      />
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
        모든 지표 — 퍼센타일이 <span className="text-[#C0392B] font-semibold">높을수록(빨강) 우수</span>합니다 (허용 지표 포함).
      </p>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b-2 border-[#0A2240] pb-1 mb-2 mt-1">
      <span className="text-sm">{icon}</span>
      <span className="text-sm font-bold text-[var(--color-text-primary)]">{title}</span>
    </div>
  )
}

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

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">{children}</p>
}

function Divider() {
  return <div className="border-t pt-2 mt-2" />
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
