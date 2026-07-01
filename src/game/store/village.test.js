import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ level: 1, reputation: 50, money: 200000, totalMembers: 0 })
})

describe('reputation', () => {
  it('clamps within [0, 100]', () => {
    useGameStore.getState().adjustReputation(-100)
    expect(useGameStore.getState().reputation).toBe(0)
    useGameStore.getState().adjustReputation(500)
    expect(useGameStore.getState().reputation).toBe(100)
  })
  it('maps reputation to bands', () => {
    useGameStore.setState({ reputation: 20 })
    expect(useGameStore.getState().reputationBand()).toBe('low')
    useGameStore.setState({ reputation: 50 })
    expect(useGameStore.getState().reputationBand()).toBe('mid')
    useGameStore.setState({ reputation: 90 })
    expect(useGameStore.getState().reputationBand()).toBe('high')
  })
})

describe('upgradeVillage', () => {
  it('does not upgrade when requirements unmet', () => {
    useGameStore.setState({ money: 200000, totalMembers: 10 })
    expect(useGameStore.getState().upgradeVillage()).toBe(false)
    expect(useGameStore.getState().level).toBe(1)
  })
  it('upgrades to level 2 when money and members met', () => {
    useGameStore.setState({ money: 200000, totalMembers: 20 })
    expect(useGameStore.getState().upgradeVillage()).toBe(true)
    expect(useGameStore.getState().level).toBe(2)
  })
})
