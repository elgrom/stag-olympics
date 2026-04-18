import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ForfeitWheel } from '../src/components/ForfeitWheel'
import type { Forfeit } from '../src/lib/types'

const forfeits: Forfeit[] = [
  { id: '1', text: 'Down your drink', is_used: false, created_at: '' },
  { id: '2', text: 'Do 10 press-ups', is_used: false, created_at: '' },
  { id: '3', text: 'Sing a song', is_used: false, created_at: '' },
  { id: '4', text: 'Dance for 30 seconds', is_used: false, created_at: '' },
]

describe('ForfeitWheel', () => {
  it('renders the spin button', () => {
    render(<ForfeitWheel forfeits={forfeits} onMarkUsed={() => {}} />)
    expect(screen.getByRole('button', { name: /spin/i })).toBeInTheDocument()
  })

  it('shows a result after spinning', async () => {
    vi.useFakeTimers()
    render(<ForfeitWheel forfeits={forfeits} onMarkUsed={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /spin/i }))

    await act(async () => {
      vi.advanceTimersByTime(3500)
    })

    const resultTexts = forfeits.map(f => f.text)
    const displayed = resultTexts.some(text => screen.queryByText(text, { exact: false }))
    expect(displayed).toBe(true)

    vi.useRealTimers()
  })

  it('disables button while spinning', () => {
    render(<ForfeitWheel forfeits={forfeits} onMarkUsed={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    const button = screen.getByRole('button', { name: /spinning/i })
    expect(button).toBeDisabled()
  })

  it('shows message when no forfeits available', () => {
    render(<ForfeitWheel forfeits={[]} onMarkUsed={() => {}} />)
    expect(screen.getByText(/no forfeits/i)).toBeInTheDocument()
  })
})
