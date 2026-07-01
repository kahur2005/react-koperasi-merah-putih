import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({ totalMembers: 0, pendingMembers: 0, money: 200000, formattedMoney: formatCurrency(200000) })
})

describe('members', () => {
  it('registerMember queues pending, commit applies them', () => {
    useGameStore.getState().registerMember()
    useGameStore.getState().registerMember()
    expect(useGameStore.getState().totalMembers).toBe(0)
    useGameStore.getState().commitPendingMembers()
    expect(useGameStore.getState().totalMembers).toBe(2)
    expect(useGameStore.getState().pendingMembers).toBe(0)
  })
  it('collectMonthlyFees adds members * 2000', () => {
    useGameStore.setState({ totalMembers: 10 })
    const fees = useGameStore.getState().collectMonthlyFees()
    expect(fees).toBe(20000)
    expect(useGameStore.getState().money).toBe(220000)
  })
})
