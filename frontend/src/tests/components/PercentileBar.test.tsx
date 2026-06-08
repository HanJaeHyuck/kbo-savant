import { render, screen } from '@testing-library/react'
import PercentileBar from '../../components/ui/PercentileBar'

describe('PercentileBar', () => {
  it('렌더링 확인', () => {
    render(<PercentileBar label="WAR" value={7.2} percentile={95} />)
    expect(screen.getByTestId('percentile-bar')).toBeInTheDocument()
  })

  it('label과 value 표시', () => {
    render(<PercentileBar label="Hard-Hit%" value="42.3%" percentile={88} />)
    expect(screen.getByText('Hard-Hit%')).toBeInTheDocument()
    expect(screen.getByText('42.3%')).toBeInTheDocument()
  })

  it('percentile=95 → 빨강 바', () => {
    render(<PercentileBar label="WAR" value={7.2} percentile={95} />)
    const redEl = document.querySelector('[data-percentile-level="red"]')
    expect(redEl).not.toBeNull()
  })

  it('percentile=50 → 회색 바', () => {
    render(<PercentileBar label="WAR" value={3.0} percentile={50} />)
    const grayEl = document.querySelector('[data-percentile-level="gray"]')
    expect(grayEl).not.toBeNull()
  })

  it('tooltip 속성 적용', () => {
    render(<PercentileBar label="WAR" value={7.2} percentile={95} tooltip="WAR 설명" />)
    expect(screen.getByTitle('WAR 설명')).toBeInTheDocument()
  })
})
