import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SprayChart from '../../components/charts/SprayChart'
import RadarChart from '../../components/charts/RadarChart'
import type { SprayData } from '../../types'

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserver

const MOCK_SPRAY: SprayData[] = [
  { spray_x: -45.2, spray_y: 120.3, result: '안타',    exit_velocity: 152.1, launch_angle: 18.4 },
  { spray_x:  12.8, spray_y:  95.7, result: '아웃',    exit_velocity: 138.2, launch_angle: -3.2 },
  { spray_x: -80.3, spray_y: 145.2, result: '홈런',    exit_velocity: 162.1, launch_angle: 27.5 },
  { spray_x:   2.1, spray_y: 110.8, result: '아웃',    exit_velocity: 138.4, launch_angle: 45.2 },
  { spray_x:  60.4, spray_y: 135.6, result: '2루타',   exit_velocity: 151.7, launch_angle: 12.8 },
]

const RADAR_STATS = ['WAR', 'wRC+', '하드힛%', '배럴%', '평균EV', 'Chase%']

/* ── SprayChart ─────────────────────────────────── */

describe('SprayChart', () => {
  it('빈 데이터 → "데이터 없음" 표시', () => {
    render(<SprayChart data={[]} colorBy="result" />)
    expect(screen.getByTestId('spray-empty')).toBeInTheDocument()
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })

  it('SprayData 있을 때 점 렌더링', () => {
    const { container } = render(<SprayChart data={MOCK_SPRAY} colorBy="result" />)
    const dots = container.querySelectorAll('[data-testid="spray-dot"]')
    expect(dots).toHaveLength(5)
  })

  it('spray-chart SVG 렌더링', () => {
    const { container } = render(<SprayChart data={MOCK_SPRAY} colorBy="result" />)
    expect(container.querySelector('[data-testid="spray-chart"]')).toBeInTheDocument()
  })

  it('colorBy="result" — 홈런 점은 빨간색', () => {
    const { container } = render(<SprayChart data={MOCK_SPRAY} colorBy="result" />)
    const dots = container.querySelectorAll('[data-testid="spray-dot"]')
    // index 2가 홈런 (#C0392B)
    expect((dots[2] as SVGCircleElement).getAttribute('fill')).toBe('#C0392B')
  })

  it('colorBy="exit_velocity" — 점 개수 동일', () => {
    const { container } = render(<SprayChart data={MOCK_SPRAY} colorBy="exit_velocity" />)
    const dots = container.querySelectorAll('[data-testid="spray-dot"]')
    expect(dots).toHaveLength(5)
  })
})

/* ── RadarChart ─────────────────────────────────── */

describe('RadarChart', () => {
  it('단일 선수 렌더링', () => {
    const players = [{
      name: '이정후',
      data: { WAR: 97, 'wRC+': 95, '하드힛%': 88, '배럴%': 82, '평균EV': 91, 'Chase%': 70 },
    }]
    const { container } = render(<RadarChart players={players} stats={RADAR_STATS} />)
    expect(container.querySelector('[data-testid="radar-chart"]')).toBeInTheDocument()
  })

  it('두 선수 겹쳐서 렌더링 — radar-chart testid 존재', () => {
    const players = [
      {
        name: '이정후',
        data: { WAR: 97, 'wRC+': 95, '하드힛%': 88, '배럴%': 82, '평균EV': 91, 'Chase%': 70 },
      },
      {
        name: '김도영',
        data: { WAR: 85, 'wRC+': 90, '하드힛%': 75, '배럴%': 70, '평균EV': 80, 'Chase%': 60 },
      },
    ]
    const { container } = render(<RadarChart players={players} stats={RADAR_STATS} />)
    expect(container.querySelector('[data-testid="radar-chart"]')).toBeInTheDocument()
    // ResponsiveContainer가 렌더링 됨
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('빈 데이터 → 빈 상태 표시', () => {
    render(<RadarChart players={[]} stats={RADAR_STATS} />)
    expect(screen.getByTestId('radar-empty')).toBeInTheDocument()
  })

  it('단일 선수 → radar-chart testid 존재', () => {
    const players = [{
      name: '이정후',
      data: { WAR: 97, 'wRC+': 95, '하드힛%': 88, '배럴%': 82, '평균EV': 91, 'Chase%': 70 },
    }]
    const { container } = render(<RadarChart players={players} stats={RADAR_STATS} />)
    expect(container.querySelector('[data-testid="radar-chart"]')).toBeInTheDocument()
  })
})
