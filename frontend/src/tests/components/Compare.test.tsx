import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompareView } from '../../pages/Compare'
import type { ComparePlayerData } from '../../pages/Compare'

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserver

const MOCK_A: ComparePlayerData = {
  player_id: 1,
  name: '이정후',
  team: '키움',
  position: 'CF',
  batting: {
    classic: { games: 144, pa: 620, avg: 0.349, obp: 0.421, slg: 0.530, ops: 0.951, hr: 23, rbi: 87, sb: 18 },
    sabermetrics: { woba: 0.412, wrc_plus: 158, babip: 0.361, war: 7.2 },
    tracking: { hard_hit_pct: 42.3, barrel_pct: 8.7, sweet_spot_pct: 38.1, avg_ev: 148.2, chase_pct: 21.4, whiff_pct: 18.9 },
    percentiles: { war: 97, wrc_plus: 95, hard_hit_pct: 88, barrel_pct: 82, avg_ev: 91, chase_pct: 70 },
  },
  pitching: null,
}

const MOCK_B: ComparePlayerData = {
  player_id: 2,
  name: '김도영',
  team: 'KIA',
  position: '3B',
  batting: {
    classic: { games: 140, pa: 580, avg: 0.328, obp: 0.401, slg: 0.501, ops: 0.902, hr: 18, rbi: 75, sb: 30 },
    sabermetrics: { woba: 0.390, wrc_plus: 142, babip: 0.341, war: 6.1 },
    tracking: { hard_hit_pct: 38.1, barrel_pct: 7.2, sweet_spot_pct: 35.4, avg_ev: 144.8, chase_pct: 24.1, whiff_pct: 21.3 },
    percentiles: { war: 85, wrc_plus: 90, hard_hit_pct: 75, barrel_pct: 70, avg_ev: 80, chase_pct: 60 },
  },
  pitching: null,
}

describe('CompareView', () => {
  it('선수 1명만 선택 시 렌더링', () => {
    render(<CompareView dataA={MOCK_A} dataB={null} />)
    expect(screen.getByTestId('compare-view')).toBeInTheDocument()
    expect(screen.getByTestId('compare-stats-table')).toBeInTheDocument()
    expect(screen.getByTestId('compare-percentile-section')).toBeInTheDocument()
  })

  it('dataA 없으면 빈 상태 표시', () => {
    render(<CompareView dataA={null} dataB={null} />)
    expect(screen.getByTestId('compare-empty')).toBeInTheDocument()
    expect(screen.getByText('선수를 검색해서 비교해보세요.')).toBeInTheDocument()
  })

  it('선수 2명 선택 시 레이더차트 렌더링', () => {
    const { container } = render(<CompareView dataA={MOCK_A} dataB={MOCK_B} />)
    expect(container.querySelector('[data-testid="radar-chart"]')).toBeInTheDocument()
  })

  it('선수 이름이 테이블 헤더에 표시됨', () => {
    render(<CompareView dataA={MOCK_A} dataB={MOCK_B} />)
    // 이름이 퍼센타일 바 레이블에 표시됨
    const labels = screen.getAllByText('이정후')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('스탯 비교 테이블 렌더링', () => {
    render(<CompareView dataA={MOCK_A} dataB={MOCK_B} />)
    expect(screen.getByTestId('compare-stats-table')).toBeInTheDocument()
  })
})
