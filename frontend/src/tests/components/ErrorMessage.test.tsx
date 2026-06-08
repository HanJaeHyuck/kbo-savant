import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorMessage from '../../components/ui/ErrorMessage'

describe('ErrorMessage', () => {
  it('not_found → 404 메시지 렌더링', () => {
    render(<MemoryRouter><ErrorMessage type="not_found" /></MemoryRouter>)
    expect(screen.getByText('선수를 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('not_found → 홈으로 버튼 표시', () => {
    render(<MemoryRouter><ErrorMessage type="not_found" /></MemoryRouter>)
    expect(screen.getByText('홈으로 돌아가기')).toBeInTheDocument()
  })

  it('server_error → 서버 오류 메시지 렌더링', () => {
    render(<MemoryRouter><ErrorMessage type="server_error" /></MemoryRouter>)
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument()
  })

  it('network_error → 네트워크 메시지 렌더링', () => {
    render(<MemoryRouter><ErrorMessage type="network_error" /></MemoryRouter>)
    expect(screen.getByText(/인터넷 연결/)).toBeInTheDocument()
  })

  it('server_error + onRetry → 다시 시도 버튼 표시', () => {
    const mockRetry = vi.fn()
    render(<MemoryRouter><ErrorMessage type="server_error" onRetry={mockRetry} /></MemoryRouter>)
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })
})
