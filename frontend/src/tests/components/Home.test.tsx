import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Home from '../../pages/Home'
import * as useLeaderboardModule from '../../hooks/useLeaderboard'

vi.mock('../../hooks/useLeaderboard', () => ({
  useLeaderboard: vi.fn(() => ({ data: null, loading: false, error: null })),
}))

vi.mock('../../hooks/usePlayerSearch', () => ({
  usePlayerSearch: () => ({ results: [], loading: false, search: vi.fn() }),
}))

const renderHome = () =>
  render(<MemoryRouter><Home /></MemoryRouter>)

describe('Home', () => {
  beforeEach(() => {
    vi.mocked(useLeaderboardModule.useLeaderboard).mockReturnValue({ data: null, loading: false, error: null })
  })

  it('검색창 렌더링', () => {
    renderHome()
    expect(screen.getByPlaceholderText(/선수명을 입력/)).toBeInTheDocument()
  })

  it('주목 선수 섹션 렌더링', () => {
    renderHome()
    expect(screen.getByTestId('highlights-section')).toBeInTheDocument()
    expect(screen.getByText('이번 주 주목 선수')).toBeInTheDocument()
  })

  it('하이라이트 카드 3개 렌더링', () => {
    renderHome()
    expect(screen.getAllByTestId('highlight-card')).toHaveLength(3)
  })

  it('WAR 미리보기 섹션 렌더링', () => {
    renderHome()
    expect(screen.getByTestId('war-preview-section')).toBeInTheDocument()
    expect(screen.getByText('타자 WAR Top 5')).toBeInTheDocument()
    expect(screen.getByText('투수 WAR Top 5')).toBeInTheDocument()
  })

  it('데이터 없을 때 "데이터가 없습니다" 표시', () => {
    renderHome()
    const empties = screen.getAllByText('데이터가 없습니다.')
    expect(empties.length).toBeGreaterThanOrEqual(1)
  })

  it('로딩 중일 때 스켈레톤 렌더링', () => {
    vi.mocked(useLeaderboardModule.useLeaderboard).mockReturnValue({ data: null, loading: true, error: null })
    renderHome()
    expect(screen.getAllByTestId('skeleton-block').length).toBeGreaterThan(0)
  })

  it('전체보기 링크가 /leaderboard로 연결', () => {
    renderHome()
    const links = screen.getAllByText('전체보기 →')
    links.forEach((link) => {
      expect(link.closest('a')).toHaveAttribute('href', '/leaderboard')
    })
  })
})
