import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

function seedStockedStore() {
  useGameStore.setState({
    level: 1, reputation: 50, money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 0, pendingMembers: 0, currentCustomers: 0, queue: [], dayIncome: 0,
    racks: [
      { id: 'r1', itemType: 'rice', capacity: 20, currentStock: 20 },
      { id: 'r2', itemType: 'gas', capacity: 20, currentStock: 20 },
    ],
  })
}

beforeEach(seedStockedStore)

describe('serveCustomer', () => {
  it('sells stock, adds money, and can convert a member', () => {
    useGameStore.setState({ queue: [{ id: 'c1', requestedItem: 'rice' }] })
    const served = useGameStore.getState().serveCustomer(() => 0) // rng 0 -> always convert
    expect(served.id).toBe('c1')
    expect(useGameStore.getState().money).toBe(212000) // +12000 rice
    expect(useGameStore.getState().stockOf('rice')).toBe(19)
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

describe('failCustomer', () => {
  it('drops reputation', () => {
    useGameStore.setState({ reputation: 50 })
    useGameStore.getState().failCustomer({ id: 'c9', requestedItem: 'rice' })
    expect(useGameStore.getState().reputation).toBe(48) // failDelta -2
  })
})

describe('spawnCustomers', () => {
  it('queues customers whose item is in stock', () => {
    // rng() = 0 -> spawn band min (mid = 8), all request rice (index 0)
    const count = useGameStore.getState().spawnCustomers(() => 0)
    expect(count).toBe(8)
    expect(useGameStore.getState().queue.length).toBe(8)
    expect(useGameStore.getState().queue.every((c) => c.requestedItem === 'rice')).toBe(true)
  })
  it('halves spawn count when a required item is empty', () => {
    useGameStore.setState({ racks: [{ id: 'r1', itemType: 'rice', capacity: 20, currentStock: 0 },
                                     { id: 'r2', itemType: 'gas', capacity: 20, currentStock: 20 }] })
    const count = useGameStore.getState().spawnCustomers(() => 0) // mid min 8 -> *0.5 = 4
    expect(count).toBe(4)
  })
})
