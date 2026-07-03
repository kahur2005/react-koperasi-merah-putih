import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({
    level: 1,
    money: 5000000,
    formattedMoney: formatCurrency(5000000),
    racks: [],
    cashierCount: 1,
    placeableCount: 0,
    sectors: {
      rice: { id: 'rice', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      fruit: { id: 'fruit', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      gas: { id: 'gas', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
    },
    notifications: [],
  })
})

describe('facilities and restocking', () => {
  it('enforces rack cap for level 1 and charges for paid racks', () => {
    for (let i = 0; i < 3; i++) expect(useGameStore.getState().addRack('rice')).toBe(true)
    expect(useGameStore.getState().addRack('rice')).toBe(false)
    expect(useGameStore.getState().racks.length).toBe(3)
    expect(useGameStore.getState().money).toBe(4250000)
  })

  it('enforces cashier cap for level 1', () => {
    expect(useGameStore.getState().addCashier()).toBe(false)
    expect(useGameStore.getState().cashierCount).toBe(1)
  })

  it('restocks from company and respects product capacity', () => {
    useGameStore.getState().addRack('rice', { free: true })
    expect(useGameStore.getState().restockItem('rice', 120, 'company')).toBe(true)
    expect(useGameStore.getState().stockOf('rice')).toBe(100)
    expect(useGameStore.getState().money).toBe(4000000)
  })

  it('restocks from local supplier using sector discount', () => {
    useGameStore.setState({
      sectors: {
        rice: { id: 'rice', level: 2, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
        fruit: { id: 'fruit', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
        gas: { id: 'gas', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      },
    })
    useGameStore.getState().addRack('rice', { free: true })
    expect(useGameStore.getState().restockItem('rice', 10, 'local')).toBe(true)
    expect(useGameStore.getState().money).toBe(4910000)
  })
})
