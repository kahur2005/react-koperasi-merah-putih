import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ level: 1, racks: [], cashierCount: 1 })
})

describe('facilities', () => {
  it('enforces rack cap for level 1 (max 4)', () => {
    for (let i = 0; i < 4; i++) expect(useGameStore.getState().addRack('rice')).toBe(true)
    expect(useGameStore.getState().addRack('rice')).toBe(false)
    expect(useGameStore.getState().racks.length).toBe(4)
  })
  it('enforces cashier cap for level 1 (max 1)', () => {
    expect(useGameStore.getState().addCashier()).toBe(false)
    expect(useGameStore.getState().cashierCount).toBe(1)
  })
  it('restock respects fixed capacity of 20', () => {
    useGameStore.getState().addRack('rice')
    useGameStore.getState().restockItem('rice', 999)
    expect(useGameStore.getState().stockOf('rice')).toBe(20)
  })
  it('consumeStock reduces and reports insufficient', () => {
    useGameStore.getState().addRack('gas')
    useGameStore.getState().restockItem('gas', 2)
    expect(useGameStore.getState().consumeStock('gas', 1)).toBe(true)
    expect(useGameStore.getState().stockOf('gas')).toBe(1)
    expect(useGameStore.getState().consumeStock('gas', 5)).toBe(false)
    expect(useGameStore.getState().stockOf('gas')).toBe(1)
  })
})
