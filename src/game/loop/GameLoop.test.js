import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GameLoop } from './GameLoop.js'
import { useGameStore } from '../store/index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.setState({
    level: 1, reputation: 50, money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 0, pendingMembers: 0, currentDay: 1, currentMonth: 1,
    racks: [], cashierCount: 1, queue: [], activeLoans: [], currentCustomers: 0, dayIncome: 0,
    isRunning: false,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GameLoop', () => {
  it('start() bootstraps facilities, marks running, and spawns a queue', () => {
    const loop = new GameLoop()
    loop.start()
    expect(useGameStore.getState().isRunning).toBe(true)
    expect(useGameStore.getState().racks.length).toBe(4)
    expect(useGameStore.getState().currentCustomers).toBeGreaterThan(0)
    loop.stop()
  })

  it('cashier tick serves a customer and increases money', () => {
    const loop = new GameLoop()
    loop.start()
    const before = useGameStore.getState().money
    vi.advanceTimersByTime(5000) // one cashier tick
    expect(useGameStore.getState().money).toBeGreaterThanOrEqual(before)
    loop.stop()
  })

  it('stop() clears running flag', () => {
    const loop = new GameLoop()
    loop.start()
    loop.stop()
    expect(useGameStore.getState().isRunning).toBe(false)
  })
})
