import { describe, it, expect } from 'vitest'

describe('Supabase config', () => {
  it('VITE_SUPABASE_URL has no trailing whitespace or newlines', () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string
    expect(url).toBeDefined()
    expect(url).toBe(url.trim())
    expect(url).not.toMatch(/[\n\r]/)
  })

  it('VITE_SUPABASE_ANON_KEY has no trailing whitespace or newlines', () => {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    expect(key).toBeDefined()
    expect(key).toBe(key.trim())
    expect(key).not.toMatch(/[\n\r]/)
    expect(key).not.toMatch(/%0A/)
  })
})
