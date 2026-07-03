import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({ totalMembers: 100, pendingMembers: 0, money: 5000000, formattedMoney: formatCurrency(5000000) })
})

describe('members', () => {
  it('registerMember queues pending, commit applies them', () => {
    useGameStore.getState().registerMember()
    useGameStore.getState().registerMember()
    expect(useGameStore.getState().totalMembers).toBe(100)
    useGameStore.getState().commitPendingMembers()
    expect(useGameStore.getState().totalMembers).toBe(102)
    expect(useGameStore.getState().pendingMembers).toBe(0)
  })

  it('collectMonthlyFees adds members * 2000', () => {
    const fees = useGameStore.getState().collectMonthlyFees()
    expect(fees).toBe(200000)
    expect(useGameStore.getState().money).toBe(5200000)
  })
})
