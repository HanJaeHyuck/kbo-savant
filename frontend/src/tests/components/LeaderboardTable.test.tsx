import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import LeaderboardTable from '../../components/tables/LeaderboardTable'
import PercentileBar from '../../components/ui/PercentileBar'
import type { LeaderboardRow } from '../../types'

const BATTING_ROWS: LeaderboardRow[] = [
  { rank: 1, player_id: 1, name: '이정후', team: '키움', position: 'CF', war: 7.2, wrc_plus: 158, ops: 0.951, hard_hit_pct: 42.3, barrel_pct: 8.7, avg_ev: 148.2, percentile_war: 97 },
  { rank: 2, player_id: 2, name: '김도영', team: 'KIA', position: '3B', war: 6.8, wrc_plus: 145, ops: 0.920, hard_hit_pct: 38.1, barrel_pct: 7.2, avg_ev: 145.8, percentile_war: 93 },
]

const PITCHING_ROWS: LeaderboardRow[] = [
  { rank: 1, player_id: 3, name: '양현종', team: 'KIA', position: 'P', war: 6.2, fip: 3.12, era_minus: 72, csw_pct: 31.8, whiff_pct: 29.4, hard_hit_pct: 28.1 },
  { rank: 2, player_id: 4, name: '원태인', team: '삼성', position: 'P', war: 5.8, fip: 3.45, era_minus: 78, csw_pct: 28.5, whiff_pct: 27.1, hard_hit_pct: 30.2 },
]

function renderTable(props: Partial<Parameters<typeof LeaderboardTable>[0]> = {}) {
  const defaults = {
    data: BATTING_ROWS,
    type: 'batting' as const,
    sortStat: 'war',
    sortDir: 'desc' as const,
    onSort: vi.fn(),
    onPlayerClick: vi.fn(),
  }
  render(
    <MemoryRouter>
      <LeaderboardTable {...defaults} {...props} />
    </MemoryRouter>
  )
}

describe('LeaderboardTable', () => {
  it('타자 mock 데이터 렌더링', () => {
    renderTable()
    expect(screen.getByText('이정후')).toBeInTheDocument()
    expect(screen.getByText('김도영')).toBeInTheDocument()
    expect(screen.getByTestId('header-war')).toBeInTheDocument()
    expect(screen.getByTestId('header-wrc_plus')).toBeInTheDocument()
  })

  it('투수 mock 데이터 렌더링 → FIP 컬럼 표시', () => {
    renderTable({ data: PITCHING_ROWS, type: 'pitching' })
    expect(screen.getByText('양현종')).toBeInTheDocument()
    expect(screen.getByTestId('header-fip')).toBeInTheDocument()
    // 타자 전용 컬럼은 없어야 함
    expect(screen.queryByTestId('header-ops')).not.toBeInTheDocument()
  })

  it('선수 행 클릭 → onPlayerClick 호출', () => {
    const onPlayerClick = vi.fn()
    renderTable({ onPlayerClick })
    const rows = screen.getAllByTestId('leaderboard-row')
    fireEvent.click(rows[0])
    expect(onPlayerClick).toHaveBeenCalledWith(1)
  })

  it('WAR 헤더 클릭 → onSort 호출', () => {
    const onSort = vi.fn()
    renderTable({ onSort })
    fireEvent.click(screen.getByTestId('header-war'))
    expect(onSort).toHaveBeenCalledWith('war')
  })

  it('sortStat=war, sortDir=desc → ▼ 표시', () => {
    renderTable({ sortStat: 'war', sortDir: 'desc' })
    expect(screen.getByTestId('header-war').textContent).toContain('▼')
  })

  it('sortStat=war, sortDir=asc → ▲ 표시', () => {
    renderTable({ sortStat: 'war', sortDir: 'asc' })
    expect(screen.getByTestId('header-war').textContent).toContain('▲')
  })

  it('다른 컬럼 정렬 시 WAR 헤더에 지시자 없음', () => {
    renderTable({ sortStat: 'wrc_plus', sortDir: 'desc' })
    const warHeader = screen.getByTestId('header-war')
    expect(warHeader.textContent).not.toContain('▼')
    expect(warHeader.textContent).not.toContain('▲')
  })

  it('행이 2개 렌더링됨', () => {
    renderTable()
    expect(screen.getAllByTestId('leaderboard-row')).toHaveLength(2)
  })
})

describe('PercentileBar 퍼센타일 색상', () => {
  it('percentile=90 → 빨강 클래스/색상 적용', () => {
    const { container } = render(
      <PercentileBar label="WAR" value={7.2} percentile={90} />
    )
    const bar = container.querySelector('[data-testid="percentile-bar-fill"]')
    // 90+ → #C0392B (빨강)
    expect(bar).toHaveStyle({ backgroundColor: '#C0392B' })
  })

  it('percentile=50 → 회색 색상 적용', () => {
    const { container } = render(
      <PercentileBar label="WAR" value={3.0} percentile={50} />
    )
    const bar = container.querySelector('[data-testid="percentile-bar-fill"]')
    expect(bar).toHaveStyle({ backgroundColor: '#95A5A6' })
  })

  it('percentile=10 → 파랑 색상 적용', () => {
    const { container } = render(
      <PercentileBar label="WAR" value={0.5} percentile={10} />
    )
    const bar = container.querySelector('[data-testid="percentile-bar-fill"]')
    expect(bar).toHaveStyle({ backgroundColor: '#1E3A8A' })
  })
})
