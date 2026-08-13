import { useState, useEffect } from 'react'
import NavBar from '../components/ui/NavBar'
import PlayerSearchInput from '../components/ui/PlayerSearchInput'
import SkeletonBlock from '../components/ui/SkeletonBlock'
import RadarChart from '../components/charts/RadarChart'
import { getCompare } from '../api/compare'
import type { Player } from '../types'

/* ── 타입 정의 ─────────────────────────────────── */
interface BattingStats {
  classic: { games: number; pa: number; avg: number; obp: number; slg: number; ops: number; hr: number; rbi: number; sb: number }
  sabermetrics: { woba: number; wrc_plus: number; babip: number; war: number }
  tracking: { hard_hit_pct: number; barrel_pct: number; sweet_spot_pct: number; avg_ev: number; chase_pct: number; whiff_pct: number; xba?: number | null; xslg?: number | null; xwoba?: number | null }
  percentiles: Record<string, number>
}

interface PitchingStats {
  classic: { games: number; gs: number; ip: number; wins: number; losses: number; era: number }
  sabermetrics: { fip: number; xfip: number; era_minus: number; fip_minus: number; k_pct: number; bb_pct: number; babip: number; war: number }
  tracking: { avg_ev_allowed: number; hard_hit_pct: number; barrel_pct: number; csw_pct: number; whiff_pct: number; chase_pct: number; xera?: number | null; allowed_xba?: number | null; gb_pct?: number | null; fastball_velo?: number | null; spin?: number | null }
  percentiles: Record<string, number>
}

export interface ComparePlayerData {
  player_id: number
  name: string
  team: string
  position: string
  batting: BattingStats | null
  pitching: PitchingStats | null
}

/* ── 퍼센타일 컬러 ────────────────────────────── */
function getPercentileColor(p: number): string {
  if (p >= 90) return '#C0392B'
  if (p >= 75) return '#E67E22'
  if (p >= 40) return '#95A5A6'
  if (p >= 25) return '#3498DB'
  return '#1E3A8A'
}

/* ── ComparePercentileBar ─────────────────────── */
interface CPBProps {
  label: string
  a: { value: string; percentile: number }
  b: { value: string; percentile: number }
  nameA: string
  nameB: string
  demo?: boolean
}

/* KBO 미공개(트래킹) 지표 표시용 마커 */
function DemoDot() {
  return (
    <span title="KBO 미공개 트래킹 지표 — 데모(샘플) 값"
      className="ml-1 text-[9px] align-middle text-[#E0A800] cursor-help">●</span>
  )
}

function ComparePercentileBar({ label, a, b, nameA, nameB, demo }: CPBProps) {
  return (
    <div className="mb-3">
      <p className="text-[11px] text-[var(--color-text-secondary)] mb-0.5 font-medium">
        {label}{demo && <DemoDot />}
      </p>
      {/* Row A */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-bold w-14 truncate" style={{ color: '#C0392B' }}>{nameA}</span>
        <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
          <div className="h-full rounded" style={{ width: `${a.percentile}%`, backgroundColor: getPercentileColor(a.percentile) }} />
        </div>
        <span className="w-8 text-center text-[10px] rounded-full font-bold text-white" style={{ backgroundColor: getPercentileColor(a.percentile), minWidth: 24, padding: '1px 3px' }}>
          {a.percentile}
        </span>
        <span className="text-[10px] font-mono w-14 text-right text-[var(--color-text-primary)]">{a.value}</span>
      </div>
      {/* Row B */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold w-14 truncate" style={{ color: '#1E3A8A' }}>{nameB}</span>
        <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
          <div className="h-full rounded" style={{ width: `${b.percentile}%`, backgroundColor: getPercentileColor(b.percentile) }} />
        </div>
        <span className="w-8 text-center text-[10px] rounded-full font-bold text-white" style={{ backgroundColor: getPercentileColor(b.percentile), minWidth: 24, padding: '1px 3px' }}>
          {b.percentile}
        </span>
        <span className="text-[10px] font-mono w-14 text-right text-[var(--color-text-primary)]">{b.value}</span>
      </div>
    </div>
  )
}

/* ── 스탯 비교 테이블 행 ─────────────────────── */
interface StatRowCmpProps {
  label: string
  valA: string | number
  valB: string | number
  higherIsBetter?: boolean
  demo?: boolean
}

function StatRowCmp({ label, valA, valB, higherIsBetter = true, demo }: StatRowCmpProps) {
  const numA = Number(valA)
  const numB = Number(valB)
  const aBetter = higherIsBetter ? numA >= numB : numA <= numB
  const bBetter = higherIsBetter ? numB >= numA : numB <= numA
  return (
    <tr className="border-b border-gray-100">
      <td className={`py-1.5 px-2 text-right font-mono text-sm ${aBetter ? 'font-bold text-[#C0392B]' : 'text-[var(--color-text-primary)]'}`}>
        {String(valA)}
      </td>
      <td className="py-1.5 px-3 text-center text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
        {label}{demo && <DemoDot />}
      </td>
      <td className={`py-1.5 px-2 text-left font-mono text-sm ${bBetter ? 'font-bold text-[#1E3A8A]' : 'text-[var(--color-text-primary)]'}`}>
        {String(valB)}
      </td>
    </tr>
  )
}

/* ── CompareView (내보내기 — 단위 테스트용) ───── */
const BATTER_RADAR_STATS = ['WAR', 'wRC+', '하드힛%', '배럴%', '평균EV', 'Chase%']
const PITCHER_RADAR_STATS = ['WAR', 'ERA-', 'FIP', 'CSW%', 'Whiff%', 'K%']

/* null 허용 소수 3자리 포맷 (.350 형태) */
const fx = (v: number | null | undefined) =>
  v == null ? '—' : v.toFixed(3).replace(/^0/, '')

/* 퍼센타일 비교 행 정의 — value는 퍼센타일이 아닌 '실제 수치'를 표시 */
interface PctRow {
  key: string
  label: string
  demo?: boolean
  val: (d: ComparePlayerData) => string
}

const BATTER_PCT_ROWS: PctRow[] = [
  { key: 'war',          label: 'WAR',     val: d => d.batting?.sabermetrics.war.toFixed(1) ?? '-' },
  { key: 'wrc_plus',     label: 'wRC+',    val: d => String(d.batting?.sabermetrics.wrc_plus ?? '-') },
  { key: 'ops',          label: 'OPS',     val: d => d.batting ? d.batting.classic.ops.toFixed(3).replace(/^0/, '') : '-' },
  { key: 'hard_hit_pct', label: '하드힛%', demo: true, val: d => d.batting ? `${d.batting.tracking.hard_hit_pct.toFixed(1)}%` : '-' },
  { key: 'barrel_pct',   label: '배럴%',   demo: true, val: d => d.batting ? `${d.batting.tracking.barrel_pct.toFixed(1)}%` : '-' },
  { key: 'avg_ev',       label: '평균EV',  demo: true, val: d => d.batting?.tracking.avg_ev.toFixed(1) ?? '-' },
  { key: 'xwoba',        label: 'xwOBA',   demo: true, val: d => fx(d.batting?.tracking.xwoba) },
  { key: 'chase_pct',    label: 'Chase%',  demo: true, val: d => d.batting ? `${d.batting.tracking.chase_pct.toFixed(1)}%` : '-' },
]

const PITCHER_PCT_ROWS: PctRow[] = [
  { key: 'war',        label: 'WAR',    val: d => d.pitching?.sabermetrics.war.toFixed(1) ?? '-' },
  { key: 'era_minus',  label: 'ERA-',   val: d => d.pitching?.sabermetrics.era_minus.toFixed(0) ?? '-' },
  { key: 'fip',        label: 'FIP',    val: d => d.pitching?.sabermetrics.fip.toFixed(2) ?? '-' },
  { key: 'k_pct',      label: 'K%',     val: d => d.pitching ? `${d.pitching.sabermetrics.k_pct.toFixed(1)}%` : '-' },
  { key: 'csw_pct',    label: 'CSW%',   demo: true, val: d => d.pitching ? `${d.pitching.tracking.csw_pct.toFixed(1)}%` : '-' },
  { key: 'whiff_pct',  label: 'Whiff%', demo: true, val: d => d.pitching ? `${d.pitching.tracking.whiff_pct.toFixed(1)}%` : '-' },
  { key: 'xera',       label: 'xERA',   demo: true, val: d => d.pitching?.tracking.xera != null ? d.pitching.tracking.xera.toFixed(2) : '—' },
  { key: 'hard_hit_pct', label: '허용HH%', demo: true, val: d => d.pitching ? `${d.pitching.tracking.hard_hit_pct.toFixed(1)}%` : '-' },
]

export function CompareView({
  dataA,
  dataB,
}: {
  dataA: ComparePlayerData | null
  dataB: ComparePlayerData | null
}) {
  if (!dataA) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]" data-testid="compare-empty">
        <p>선수를 검색해서 비교해보세요.</p>
      </div>
    )
  }

  const isPitcherA = dataA.position === 'P'
  const isPitcherB = dataB ? dataB.position === 'P' : false
  const bothBatters  = !isPitcherA && dataB && !isPitcherB
  const bothPitchers = isPitcherA && dataB && isPitcherB

  /* 퍼센타일 데이터 추출 */
  const pctA = isPitcherA ? (dataA.pitching?.percentiles ?? {}) : (dataA.batting?.percentiles ?? {})
  const pctB = dataB
    ? (isPitcherB ? (dataB.pitching?.percentiles ?? {}) : (dataB.batting?.percentiles ?? {}))
    : {}

  /* RadarChart 데이터 */
  const radarStats = bothPitchers ? PITCHER_RADAR_STATS : BATTER_RADAR_STATS
  const radarPlayers = dataB
    ? [
        {
          name: dataA.name,
          data: {
            WAR: pctA.war ?? 50,
            'wRC+': pctA.wrc_plus ?? 50,
            '하드힛%': pctA.hard_hit_pct ?? 50,
            '배럴%': pctA.barrel_pct ?? 50,
            '평균EV': pctA.avg_ev ?? 50,
            'Chase%': pctA.chase_pct ?? 50,
            'ERA-': pctA.era_minus ?? 50,
            FIP: pctA.fip ?? 50,
            'CSW%': pctA.csw_pct ?? 50,
            'Whiff%': pctA.whiff_pct ?? 50,
            'K%': pctA.k_pct ?? 50,
          },
        },
        {
          name: dataB.name,
          data: {
            WAR: pctB.war ?? 50,
            'wRC+': pctB.wrc_plus ?? 50,
            '하드힛%': pctB.hard_hit_pct ?? 50,
            '배럴%': pctB.barrel_pct ?? 50,
            '평균EV': pctB.avg_ev ?? 50,
            'Chase%': pctB.chase_pct ?? 50,
            'ERA-': pctB.era_minus ?? 50,
            FIP: pctB.fip ?? 50,
            'CSW%': pctB.csw_pct ?? 50,
            'Whiff%': pctB.whiff_pct ?? 50,
            'K%': pctB.k_pct ?? 50,
          },
        },
      ]
    : []

  const nameA = dataA.name
  const nameB = dataB?.name ?? ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="compare-view">

      {/* 좌측: 스탯 비교 테이블 */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">스탯 비교</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="compare-stats-table">
          {/* 헤더 */}
          <div className="flex text-xs font-bold py-2 px-2 bg-gray-50 border-b">
            <span className="flex-1 text-right text-[#C0392B]">{nameA}</span>
            <span className="w-20 text-center text-gray-400">지표</span>
            <span className="flex-1 text-left text-[#1E3A8A]">{nameB || '선수 B'}</span>
          </div>
          <table className="w-full">
            <tbody>
              {/* 타자 스탯 */}
              {dataA.batting && (
                <>
                  <StatRowCmp label="AVG"   valA={dataA.batting.classic.avg.toFixed(3).replace(/^0/,'')}   valB={dataB?.batting?.classic.avg.toFixed(3).replace(/^0/,'')  ?? '-'} />
                  <StatRowCmp label="OPS"   valA={dataA.batting.classic.ops.toFixed(3).replace(/^0/,'')}   valB={dataB?.batting?.classic.ops.toFixed(3).replace(/^0/,'')  ?? '-'} />
                  <StatRowCmp label="wRC+"  valA={dataA.batting.sabermetrics.wrc_plus}                      valB={dataB?.batting?.sabermetrics.wrc_plus  ?? '-'} />
                  <StatRowCmp label="WAR"   valA={dataA.batting.sabermetrics.war.toFixed(1)}               valB={dataB?.batting?.sabermetrics.war.toFixed(1)  ?? '-'} />
                  <StatRowCmp label="wOBA"  valA={dataA.batting.sabermetrics.woba.toFixed(3).replace(/^0/,'')} valB={dataB?.batting?.sabermetrics.woba.toFixed(3).replace(/^0/,'') ?? '-'} />
                  <StatRowCmp demo label="하드힛%" valA={`${dataA.batting.tracking.hard_hit_pct.toFixed(1)}%`}   valB={dataB?.batting ? `${dataB.batting.tracking.hard_hit_pct.toFixed(1)}%` : '-'} />
                  <StatRowCmp demo label="배럴%"   valA={`${dataA.batting.tracking.barrel_pct.toFixed(1)}%`}    valB={dataB?.batting ? `${dataB.batting.tracking.barrel_pct.toFixed(1)}%`   : '-'} />
                  <StatRowCmp demo label="평균EV"  valA={dataA.batting.tracking.avg_ev.toFixed(1)}              valB={dataB?.batting?.tracking.avg_ev.toFixed(1) ?? '-'} />
                  <StatRowCmp demo label="xBA"    valA={fx(dataA.batting.tracking.xba)}                        valB={dataB?.batting ? fx(dataB.batting.tracking.xba) : '-'} />
                  <StatRowCmp demo label="xwOBA"  valA={fx(dataA.batting.tracking.xwoba)}                      valB={dataB?.batting ? fx(dataB.batting.tracking.xwoba) : '-'} />
                  <StatRowCmp demo label="Chase%"  valA={`${dataA.batting.tracking.chase_pct.toFixed(1)}%`}     valB={dataB?.batting ? `${dataB.batting.tracking.chase_pct.toFixed(1)}%` : '-'} higherIsBetter={false} />
                </>
              )}
              {/* 투수 스탯 */}
              {dataA.pitching && (
                <>
                  <StatRowCmp label="ERA"   valA={dataA.pitching.classic.era.toFixed(2)}                    valB={dataB?.pitching?.classic.era.toFixed(2) ?? '-'} higherIsBetter={false} />
                  <StatRowCmp label="FIP"   valA={dataA.pitching.sabermetrics.fip.toFixed(2)}               valB={dataB?.pitching?.sabermetrics.fip.toFixed(2) ?? '-'} higherIsBetter={false} />
                  <StatRowCmp label="ERA-"  valA={dataA.pitching.sabermetrics.era_minus.toFixed(0)}         valB={dataB?.pitching?.sabermetrics.era_minus.toFixed(0) ?? '-'} higherIsBetter={false} />
                  <StatRowCmp label="WAR"   valA={dataA.pitching.sabermetrics.war.toFixed(1)}               valB={dataB?.pitching?.sabermetrics.war.toFixed(1) ?? '-'} />
                  <StatRowCmp label="K%"    valA={`${dataA.pitching.sabermetrics.k_pct.toFixed(1)}%`}       valB={dataB?.pitching ? `${dataB.pitching.sabermetrics.k_pct.toFixed(1)}%` : '-'} />
                  <StatRowCmp label="BB%"   valA={`${dataA.pitching.sabermetrics.bb_pct.toFixed(1)}%`}      valB={dataB?.pitching ? `${dataB.pitching.sabermetrics.bb_pct.toFixed(1)}%` : '-'} higherIsBetter={false} />
                  <StatRowCmp demo label="CSW%"  valA={`${dataA.pitching.tracking.csw_pct.toFixed(1)}%`}         valB={dataB?.pitching ? `${dataB.pitching.tracking.csw_pct.toFixed(1)}%` : '-'} />
                  <StatRowCmp demo label="Whiff%" valA={`${dataA.pitching.tracking.whiff_pct.toFixed(1)}%`}      valB={dataB?.pitching ? `${dataB.pitching.tracking.whiff_pct.toFixed(1)}%` : '-'} />
                  <StatRowCmp demo label="xERA"   valA={dataA.pitching.tracking.xera != null ? dataA.pitching.tracking.xera.toFixed(2) : '-'} valB={dataB?.pitching?.tracking.xera != null ? dataB.pitching.tracking.xera.toFixed(2) : '-'} higherIsBetter={false} />
                  <StatRowCmp demo label="허용HH%" valA={`${dataA.pitching.tracking.hard_hit_pct.toFixed(1)}%`}  valB={dataB?.pitching ? `${dataB.pitching.tracking.hard_hit_pct.toFixed(1)}%` : '-'} higherIsBetter={false} />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 중앙: 퍼센타일 바 */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">퍼센타일 비교</h2>
        <div className="bg-white rounded-lg shadow p-4" data-testid="compare-percentile-section">
          {dataB ? (
            <>
              {(bothBatters || !bothPitchers) && dataA.batting && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">타격 지표</p>
                  {BATTER_PCT_ROWS.map(r => (
                    <ComparePercentileBar key={r.key} label={r.label} demo={r.demo}
                      a={{ value: r.val(dataA), percentile: pctA[r.key] ?? 50 }}
                      b={{ value: dataB ? r.val(dataB) : '-', percentile: pctB[r.key] ?? 50 }}
                      nameA={nameA} nameB={nameB} />
                  ))}
                </div>
              )}
              {(bothPitchers || (!bothBatters && dataA.pitching)) && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">투구 지표</p>
                  {PITCHER_PCT_ROWS.map(r => (
                    <ComparePercentileBar key={r.key} label={r.label} demo={r.demo}
                      a={{ value: r.val(dataA), percentile: pctA[r.key] ?? 50 }}
                      b={{ value: dataB ? r.val(dataB) : '-', percentile: pctB[r.key] ?? 50 }}
                      nameA={nameA} nameB={nameB} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-4">선수 B를 선택하면 비교가 표시됩니다.</p>
          )}
        </div>
      </div>

      {/* 우측: 레이더 차트 */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">레이더 차트</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {radarPlayers.length === 2 ? (
            <RadarChart players={radarPlayers} stats={radarStats} />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-muted)]">
              선수 B를 선택하면 레이더 차트가 표시됩니다.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

/* ── 메인 Compare 페이지 ────────────────────────── */
export default function Compare() {
  const [playerA, setPlayerA] = useState<Player | null>(null)
  const [playerB, setPlayerB] = useState<Player | null>(null)
  const [compareData, setCompareData] = useState<ComparePlayerData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const season = 2024

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (playerA && playerB) {
        setLoading(true)
        try {
          const data = await getCompare(`${playerA.id},${playerB.id}`, season)
          if (!cancelled) setCompareData(data)
        } catch {
          if (!cancelled) setCompareData(null)
        } finally {
          if (!cancelled) setLoading(false)
        }
      } else if (playerA) {
        // fetch single player from compare endpoint
        try {
          const data = await getCompare(`${playerA.id}`, season)
          if (!cancelled) setCompareData(data)
        } catch {
          if (!cancelled) setCompareData(null)
        }
      } else {
        setCompareData(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [playerA, playerB])

  const dataA = compareData?.[0] ?? null
  const dataB = compareData?.[1] ?? null

  const handleReset = () => {
    setPlayerA(null)
    setPlayerB(null)
    setCompareData(null)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <NavBar />

      {/* 비교 헤더 */}
      <div className="bg-[#0A2240] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">

            {/* 선수 A */}
            <div className="flex-1 min-w-0" data-testid="search-a">
              <p className="text-[10px] text-blue-300 mb-1">선수 A</p>
              <PlayerSearchInput onSelect={setPlayerA} placeholder="선수 A 검색..." />
              {playerA && (
                <p className="mt-1 text-sm font-bold" style={{ color: '#F87171' }}>
                  {playerA.name} · {playerA.team}
                </p>
              )}
            </div>

            <div className="text-2xl font-bold text-blue-300 mx-2 hidden md:block">vs</div>

            {/* 선수 B */}
            <div className="flex-1 min-w-0" data-testid="search-b">
              <p className="text-[10px] text-blue-300 mb-1">선수 B</p>
              <PlayerSearchInput onSelect={setPlayerB} placeholder="선수 B 검색..." />
              {playerB && (
                <p className="mt-1 text-sm font-bold" style={{ color: '#93C5FD' }}>
                  {playerB.name} · {playerB.team}
                </p>
              )}
            </div>

            {/* 초기화 버튼 */}
            {(playerA || playerB) && (
              <button
                onClick={handleReset}
                className="text-xs text-blue-300 hover:text-white border border-blue-600 rounded px-3 py-1.5 shrink-0"
                data-testid="reset-btn"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <SkeletonBlock key={i} height="300px" />)}
          </div>
        ) : (
          <CompareView dataA={dataA} dataB={dataB} />
        )}
      </main>
    </div>
  )
}
