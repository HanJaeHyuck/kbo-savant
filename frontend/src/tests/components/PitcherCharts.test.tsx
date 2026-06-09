import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StrikeZoneMap from '../../components/charts/StrikeZoneMap'
import VeloTrend from '../../components/charts/VeloTrend'
import PitchMix from '../../components/charts/PitchMix'
import type { ZoneData } from '../../types'

// Recharts ResizeObserver mock
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserver

const MOCK_ZONE_DATA: ZoneData[] = [
  { zone: 1, pitches: 50,  batting_avg: 0.250, whiff_pct: 20.0 },
  { zone: 2, pitches: 80,  batting_avg: 0.300, whiff_pct: 18.0 },
  { zone: 3, pitches: 45,  batting_avg: 0.200, whiff_pct: 22.0 },
  { zone: 4, pitches: 70,  batting_avg: 0.270, whiff_pct: 19.0 },
  { zone: 5, pitches: 120, batting_avg: 0.350, whiff_pct: 15.0 },
  { zone: 6, pitches: 65,  batting_avg: 0.230, whiff_pct: 21.0 },
  { zone: 7, pitches: 40,  batting_avg: 0.180, whiff_pct: 25.0 },
  { zone: 8, pitches: 90,  batting_avg: 0.310, whiff_pct: 17.0 },
  { zone: 9, pitches: 55,  batting_avg: 0.220, whiff_pct: 23.0 },
]

const MOCK_VELO_DATA = [
  { game_date: '2024-04-01', avg_velocity: 147.1 },
  { game_date: '2024-04-07', avg_velocity: 148.4 },
  { game_date: '2024-04-13', avg_velocity: 149.0 },
  { game_date: '2024-04-20', avg_velocity: 147.8 },
]

const MOCK_PITCH_MIX = [
  { pitch_type: '직구',    count: 500, pct: 38.0, avg_velocity: 148.2 },
  { pitch_type: '슬라이더', count: 350, pct: 26.5, avg_velocity: 132.5 },
  { pitch_type: '체인지업', count: 280, pct: 21.2, avg_velocity: 128.8 },
  { pitch_type: '커브',    count: 190, pct: 14.3, avg_velocity: 118.3 },
]

/* ── StrikeZoneMap ──────────────────────────── */

describe('StrikeZoneMap', () => {
  it('빈 데이터 → "데이터 없음" 표시', () => {
    render(<StrikeZoneMap data={[]} colorBy="batting_avg" />)
    expect(screen.getByTestId('zone-empty')).toBeInTheDocument()
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })

  it('ZoneData 있을 때 9개 셀 렌더링', () => {
    const { container } = render(<StrikeZoneMap data={MOCK_ZONE_DATA} colorBy="batting_avg" />)
    const cells = container.querySelectorAll('[data-testid="zone-cell"]')
    expect(cells).toHaveLength(9)
  })

  it('colorBy="batting_avg" — SVG 렌더링됨', () => {
    const { container } = render(<StrikeZoneMap data={MOCK_ZONE_DATA} colorBy="batting_avg" />)
    expect(container.querySelector('[data-testid="strike-zone-map"]')).toBeInTheDocument()
  })

  it('존 5 값이 표시됨', () => {
    render(<StrikeZoneMap data={MOCK_ZONE_DATA} colorBy="batting_avg" />)
    expect(screen.getByTestId('zone-value-5')).toBeInTheDocument()
    expect(screen.getByTestId('zone-value-5').textContent).toBe('.350')
  })

  it('colorBy="whiff_pct" — whiff_pct 값 표시', () => {
    render(<StrikeZoneMap data={MOCK_ZONE_DATA} colorBy="whiff_pct" />)
    const zone5 = screen.getByTestId('zone-value-5')
    expect(zone5.textContent).toBe('15.0')
  })
})

/* ── VeloTrend ──────────────────────────────── */

describe('VeloTrend', () => {
  it('라인차트 렌더링', () => {
    const { container } = render(<VeloTrend data={MOCK_VELO_DATA} />)
    expect(container.querySelector('[data-testid="velo-trend-chart"]')).toBeInTheDocument()
  })

  it('빈 데이터 → 빈 상태 표시', () => {
    render(<VeloTrend data={[]} />)
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })
})

/* ── PitchMix ───────────────────────────────── */

describe('PitchMix', () => {
  it('4개 구종 바 렌더링', () => {
    const { container } = render(<PitchMix data={MOCK_PITCH_MIX} season={2024} />)
    const rows = container.querySelectorAll('[data-testid="pitch-mix-row"]')
    expect(rows).toHaveLength(4)
  })

  it('구종명 표시', () => {
    render(<PitchMix data={MOCK_PITCH_MIX} season={2024} />)
    expect(screen.getByText('직구')).toBeInTheDocument()
    expect(screen.getByText('슬라이더')).toBeInTheDocument()
  })

  it('pitch-mix 컨테이너 렌더링', () => {
    const { container } = render(<PitchMix data={MOCK_PITCH_MIX} season={2024} />)
    expect(container.querySelector('[data-testid="pitch-mix"]')).toBeInTheDocument()
  })

  it('빈 데이터 → 빈 상태 표시', () => {
    render(<PitchMix data={[]} season={2024} />)
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })
})
