import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

function resetGameState() {
  useGameStore.setState({
    gameStatus: 'running',
    lossReason: '',
    level: 1,
    happiness: 70,
    money: 5000000,
    formattedMoney: formatCurrency(5000000),
    totalMembers: 100,
    pendingMembers: 0,
    currentDay: 1,
    currentMonth: 1,
    racks: [],
    cashierCount: 1,
    queue: [],
    activeLoanRequests: [],
    acceptedLoans: [],
    currentCustomers: 0,
    dayIncome: 0,
    disappointedCustomers: 0,
    notifications: [],
    sectors: {
      rice: { id: 'rice', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      fruit: { id: 'fruit', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      gas: { id: 'gas', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
    },
  })
}

beforeEach(resetGameState)

describe('bootstrap', () => {
  it('seeds three stocked product racks and an opening loan request', () => {
    useGameStore.setState({ currentDay: 3 })
    useGameStore.getState().bootstrap()
    expect(useGameStore.getState().racks).toHaveLength(3)
    expect(useGameStore.getState().stockOf('rice')).toBe(100)
    expect(useGameStore.getState().stockOf('fruit')).toBe(80)
    expect(useGameStore.getState().stockOf('gas')).toBe(60)
    expect(useGameStore.getState().activeLoanRequests).toHaveLength(1)
  })
})

describe('endDay', () => {
  it('commits pending members, applies stock happiness, and advances the day', () => {
    useGameStore.setState({
      pendingMembers: 3,
      racks: [
        { id: 'r1', itemType: 'rice', capacity: 100, currentStock: 100 },
        { id: 'r2', itemType: 'fruit', capacity: 80, currentStock: 80 },
        { id: 'r3', itemType: 'gas', capacity: 60, currentStock: 60 },
      ],
    })
    useGameStore.getState().endDay(() => 0)
    expect(useGameStore.getState().totalMembers).toBe(103)
    expect(useGameStore.getState().happiness).toBe(72)
    expect(useGameStore.getState().currentDay).toBe(2)
  })

  it('upgrades and refreshes capacities when member thresholds are met', () => {
    useGameStore.setState({
      totalMembers: 300,
      racks: [{ id: 'r1', itemType: 'rice', capacity: 100, currentStock: 100 }],
    })
    useGameStore.getState().endDay(() => 0)
    expect(useGameStore.getState().level).toBe(2)
    expect(useGameStore.getState().racks[0].capacity).toBe(150)
  })

  it('marks win when level 3 target state is reached', () => {
    useGameStore.setState({ level: 3, totalMembers: 500, happiness: 60, money: 1000 })
    expect(useGameStore.getState().checkWinLose()).toBe('won')
    expect(useGameStore.getState().gameStatus).toBe('won')
  })

  it('marks loss when happiness reaches zero', () => {
    useGameStore.setState({ happiness: 0 })
    expect(useGameStore.getState().checkWinLose()).toBe('lost')
    expect(useGameStore.getState().lossReason).toContain('happiness')
  })
})
