import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import PlayerSearchInput from '../../components/ui/PlayerSearchInput'

// usePlayerSearch 훅 모킹
const mockSearch = vi.fn()
const mockResults = [
  { id: 1, name: '이정후', team: '키움 히어로즈', position: 'CF' },
  { id: 2, name: '이대호', team: '롯데 자이언츠', position: '1B' },
]

vi.mock('../../hooks/usePlayerSearch', () => ({
  usePlayerSearch: () => ({
    results: mockResults,
    loading: false,
    search: mockSearch,
  }),
}))

describe('PlayerSearchInput', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1글자 입력 → 드롭다운 미표시', async () => {
    render(<PlayerSearchInput onSelect={mockOnSelect} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '이')
    // open 조건: length >= 2 → 1글자면 드롭다운 없음
    expect(screen.queryByText('이정후')).not.toBeInTheDocument()
  })

  it('2글자 이상 입력 → 드롭다운 표시', async () => {
    render(<PlayerSearchInput onSelect={mockOnSelect} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '이정')
    await waitFor(() => {
      expect(screen.getByText('이정후')).toBeInTheDocument()
    })
  })

  it('ESC 키 → 드롭다운 닫힘', async () => {
    render(<PlayerSearchInput onSelect={mockOnSelect} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '이정')
    await waitFor(() => expect(screen.getByText('이정후')).toBeInTheDocument())

    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByText('이정후')).not.toBeInTheDocument()
    })
  })

  it('키보드 방향키로 선택 이동 (ArrowDown)', async () => {
    render(<PlayerSearchInput onSelect={mockOnSelect} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '이정')
    await waitFor(() => expect(screen.getByText('이정후')).toBeInTheDocument())

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    // 첫 번째 항목이 활성화되어 bg-blue-50 클래스 적용
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveClass('bg-blue-50')
  })

  it('선수 클릭 → onSelect 콜백 호출', async () => {
    render(<PlayerSearchInput onSelect={mockOnSelect} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '이정')
    await waitFor(() => expect(screen.getByText('이정후')).toBeInTheDocument())

    fireEvent.mouseDown(screen.getByText('이정후'))
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0])
  })

  it('placeholder 표시', () => {
    render(<PlayerSearchInput onSelect={mockOnSelect} placeholder="선수 검색" />)
    expect(screen.getByPlaceholderText('선수 검색')).toBeInTheDocument()
  })
})
