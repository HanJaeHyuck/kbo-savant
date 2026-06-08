import { render, screen } from '@testing-library/react'
import StatBadge from '../../components/ui/StatBadge'

describe('StatBadge', () => {
  it('percentile=95 → 빨강(red) 레벨 적용', () => {
    render(<StatBadge label="WAR" value={7.2} percentile={95} />)
    const el = screen.getByText('7.2').closest('[data-percentile-level]')
    expect(el).toHaveAttribute('data-percentile-level', 'red')
  })

  it('percentile=80 → 주황(orange) 레벨 적용', () => {
    render(<StatBadge label="WAR" value={5.1} percentile={80} />)
    const el = screen.getByText('5.1').closest('[data-percentile-level]')
    expect(el).toHaveAttribute('data-percentile-level', 'orange')
  })

  it('percentile=50 → 회색(gray) 레벨 적용', () => {
    render(<StatBadge label="WAR" value="3.0" percentile={50} />)
    const el = screen.getByText('3.0').closest('[data-percentile-level]')
    expect(el).toHaveAttribute('data-percentile-level', 'gray')
  })

  it('percentile=30 → 하늘(sky) 레벨 적용', () => {
    render(<StatBadge label="WAR" value={1.5} percentile={30} />)
    const el = screen.getByText('1.5').closest('[data-percentile-level]')
    expect(el).toHaveAttribute('data-percentile-level', 'sky')
  })

  it('percentile=10 → 파랑(blue) 레벨 적용', () => {
    render(<StatBadge label="WAR" value={0.5} percentile={10} />)
    const el = screen.getByText('0.5').closest('[data-percentile-level]')
    expect(el).toHaveAttribute('data-percentile-level', 'blue')
  })

  it('label과 value 모두 렌더링', () => {
    render(<StatBadge label="wRC+" value={158} />)
    expect(screen.getByText('wRC+')).toBeInTheDocument()
    expect(screen.getByText('158')).toBeInTheDocument()
  })
})
