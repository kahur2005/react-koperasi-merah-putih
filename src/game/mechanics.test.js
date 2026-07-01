import { describe, it, expect } from 'vitest'
import { computeMembershipChance, spawnCountForBand } from './mechanics.js'

describe('computeMembershipChance', () => {
  it('returns base 0.4 with no modifiers', () => {
    expect(computeMembershipChance({ fullStock: false, fastQueue: false, gasEmpty: false, riceEmpty: false })).toBeCloseTo(0.4)
  })
  it('adds full-stock and fast-queue bonuses', () => {
    expect(computeMembershipChance({ fullStock: true, fastQueue: true, gasEmpty: false, riceEmpty: false })).toBeCloseTo(0.55)
  })
  it('forces 0 when rice empty', () => {
    expect(computeMembershipChance({ fullStock: true, fastQueue: true, gasEmpty: false, riceEmpty: true })).toBe(0)
  })
  it('forces 0 when gas empty', () => {
    expect(computeMembershipChance({ fullStock: false, fastQueue: false, gasEmpty: true, riceEmpty: false })).toBe(0)
  })
})

describe('spawnCountForBand', () => {
  it('returns band min with rng() = 0', () => {
    expect(spawnCountForBand('low', () => 0)).toBe(5)
    expect(spawnCountForBand('mid', () => 0)).toBe(8)
    expect(spawnCountForBand('high', () => 0)).toBe(15)
  })
  it('returns band spawnMax with rng() ~ 0.999', () => {
    expect(spawnCountForBand('low', () => 0.999)).toBe(8)
    expect(spawnCountForBand('high', () => 0.999)).toBe(25)
  })
})
