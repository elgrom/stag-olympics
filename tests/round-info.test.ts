import { describe, it, expect } from 'vitest'
import { ROUND_INFO } from '../src/lib/round-info'

describe('ROUND_INFO', () => {
  it('has info for all 8 rounds', () => {
    for (let i = 1; i <= 8; i++) {
      expect(ROUND_INFO[i]).toBeDefined()
      expect(ROUND_INFO[i].format).toBeTruthy()
      expect(ROUND_INFO[i].scoring).toBeTruthy()
      expect(ROUND_INFO[i].kit).toBeTruthy()
      expect(ROUND_INFO[i].drinking).toBeTruthy()
    }
  })

  it('has game rules for petanque (round 2)', () => {
    const petanque = ROUND_INFO[2]
    expect(petanque.rules).toBeDefined()
    expect(petanque.rules!.length).toBeGreaterThan(0)
    expect(petanque.rules!.some(r => r.toLowerCase().includes('cochonnet'))).toBe(true)
    expect(petanque.rules!.some(r => r.toLowerCase().includes('boule'))).toBe(true)
    expect(petanque.rules!.some(r => r.includes('13'))).toBe(true)
  })

  it('has game rules for tennis (round 5)', () => {
    const tennis = ROUND_INFO[5]
    expect(tennis.rules).toBeDefined()
    expect(tennis.rules!.length).toBeGreaterThan(0)
    expect(tennis.rules!.some(r => r.toLowerCase().includes('serve'))).toBe(true)
    expect(tennis.rules!.some(r => r.includes('11'))).toBe(true)
    expect(tennis.rules!.some(r => r.toLowerCase().includes('no deuces'))).toBe(true)
  })

  it('does not have rules for rounds that do not need them', () => {
    // Rounds like quiz, water balloon, taskmaster etc. don't need sport rules
    expect(ROUND_INFO[1].rules).toBeUndefined()
    expect(ROUND_INFO[3].rules).toBeUndefined()
  })
})
