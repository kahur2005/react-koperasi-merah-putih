import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ level: 1, happiness: 70, totalMembers: 100, notifications: [] })
})

describe('happiness', () => {
  it('clamps within [0, 100]', () => {
    useGameStore.getState().adjustHappiness(-100)
    expect(useGameStore.getState().happiness).toBe(0)
    useGameStore.getState().adjustHappiness(500)
    expect(useGameStore.getState().happiness).toBe(100)
  })
})

describe('upgradeVillage', () => {
  it('does not upgrade when member requirement is unmet', () => {
    useGameStore.setState({ totalMembers: 299 })
    expect(useGameStore.getState().upgradeVillage()).toBe(false)
    expect(useGameStore.getState().level).toBe(1)
  })

  it('upgrades to level 2 when members reach 300', () => {
    useGameStore.setState({ totalMembers: 300 })
    expect(useGameStore.getState().upgradeVillage()).toBe(true)
    expect(useGameStore.getState().level).toBe(2)
  })

  it('upgrades to level 3 when members reach 500 from level 2', () => {
    useGameStore.setState({ level: 2, totalMembers: 500 })
    expect(useGameStore.getState().upgradeVillage()).toBe(true)
    expect(useGameStore.getState().level).toBe(3)
  })
})
