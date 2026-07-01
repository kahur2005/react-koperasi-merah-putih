import { describe, it, expect } from 'vitest'
import { formatCurrency } from './currency.js'

describe('formatCurrency', () => {
  it('formats thousands with dots and Rp prefix', () => {
    expect(formatCurrency(200000)).toBe('Rp 200.000')
  })
  it('formats small numbers and zero', () => {
    expect(formatCurrency(0)).toBe('Rp 0')
    expect(formatCurrency(999)).toBe('Rp 999')
  })
  it('rounds and handles negatives', () => {
    expect(formatCurrency(235000.4)).toBe('Rp 235.000')
    expect(formatCurrency(-5000)).toBe('-Rp 5.000')
  })
})
