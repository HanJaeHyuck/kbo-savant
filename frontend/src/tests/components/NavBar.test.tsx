import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from '../../components/ui/NavBar'

describe('NavBar', () => {
  it('로고 텍스트 렌더링', () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>)
    expect(screen.getAllByText('KBO Savant').length).toBeGreaterThan(0)
  })

  it('홈 링크 존재', () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>)
    expect(screen.getAllByText('홈').length).toBeGreaterThan(0)
  })

  it('리더보드 링크 존재', () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>)
    expect(screen.getAllByText('리더보드').length).toBeGreaterThan(0)
  })

  it('다크모드 토글 버튼 존재', () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>)
    expect(screen.getByText(/다크|라이트/)).toBeInTheDocument()
  })
})
