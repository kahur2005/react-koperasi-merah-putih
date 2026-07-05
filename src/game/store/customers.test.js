import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

function seedStore() {
  useGameStore.setState({
    level: 1,
    happiness: 80,
    money: 5000000,
    formattedMoney: formatCurrency(5000000),
    totalMembers: 100,
    pendingMembers: 0,
    currentCustomers: 0,
    queue: [],
    dayIncome: 0,
    disappointedCustomers: 0,
    notifications: [],
    sectors: {
      rice: { id: 'rice', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      fruit: { id: 'fruit', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      gas: { id: 'gas', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
    },
    racks: [
      { id: 'r1', itemType: 'rice', capacity: 100, currentStock: 100 },
      { id: 'r2', itemType: 'fruit', capacity: 80, currentStock: 80 },
      { id: 'r3', itemType: 'gas', capacity: 60, currentStock: 60 },
    ],
  })
}

beforeEach(seedStore)

describe('serveCustomer', () => {
  it('sells stock, adds money, and can convert a member', () => {
    useGameStore.setState({ queue: [{ id: 'c1', requestedItem: 'rice' }] })
    const served = useGameStore.getState().serveCustomer(() => 0)
    expect(served.id).toBe('c1')
    expect(useGameStore.getState().money).toBe(5012000)
    expect(useGameStore.getState().stockOf('rice')).toBe(99)
    expect(useGameStore.getState().pendingMembers).toBe(1)
  })

  it('returns null on empty queue', () => {
    useGameStore.setState({ queue: [] })
    expect(useGameStore.getState().serveCustomer(() => 0)).toBe(null)
  })
  it('penalizes reputation when queued customer finds stock depleted', () => {
    useGameStore.setState({
      reputation: 50,
      queue: [{ id: 'c1', requestedItem: 'rice' }],
      racks: [
        { id: 'r1', itemType: 'rice', capacity: 20, currentStock: 0 },
        { id: 'r2', itemType: 'gas', capacity: 20, currentStock: 20 },
      ],
    })
    const served = useGameStore.getState().serveCustomer(() => 0)
    expect(served).toBe(null)
    expect(useGameStore.getState().queue.length).toBe(0)
    expect(useGameStore.getState().reputation).toBe(48) // failDelta -2
  })
})

describe('spawnCustomers', () => {
  it('queues customers whose item is in stock', () => {
    const count = useGameStore.getState().spawnCustomers(() => 0)
    expect(count).toBe(10)
    expect(useGameStore.getState().queue.length).toBe(10)
    expect(useGameStore.getState().queue.every((c) => c.requestedItem === 'rice')).toBe(true)
  })

  it('records disappointed customers when requested stock is empty', () => {
    useGameStore.setState({
      racks: [
        { id: 'r1', itemType: 'rice', capacity: 100, currentStock: 0 },
        { id: 'r2', itemType: 'fruit', capacity: 80, currentStock: 80 },
        { id: 'r3', itemType: 'gas', capacity: 60, currentStock: 60 },
      ],
    })
    useGameStore.getState().spawnCustomers(() => 0)
    expect(useGameStore.getState().queue.length).toBe(0)
    expect(useGameStore.getState().disappointedCustomers).toBe(10)
  })
})
