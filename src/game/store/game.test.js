import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({
    level: 1, reputation: 50, money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 0, pendingMembers: 0, currentDay: 1, currentMonth: 1,
    racks: [], cashierCount: 1, queue: [], activeLoans: [], currentCustomers: 0, dayIncome: 0,
  })
})

describe('bootstrap', () => {
  it('seeds 4 stocked racks', () => {
    useGameStore.getState().bootstrap()
    expect(useGameStore.getState().racks).toHaveLength(4)
    expect(useGameStore.getState().stockOf('rice')).toBe(20)
  })
})

describe('endDay', () => {
  it('commits pending members and advances the day', () => {
    useGameStore.setState({ pendingMembers: 3, currentDay: 1 })
    useGameStore.getState().endDay()
    expect(useGameStore.getState().totalMembers).toBe(3)
    expect(useGameStore.getState().currentDay).toBe(2)
  })
  it('runs monthly fees + loans on day 30 and upgrades when eligible', () => {
    useGameStore.setState({ currentDay: 30, pendingMembers: 20, money: 200000 })
    useGameStore.getState().endDay()
    const s = useGameStore.getState()
    // 20 members committed -> upgrade to L2, then monthly fees 20*2000 = 40000,
    // then 5% of 20 = 1 member borrows a random amount out of coop cash.
    expect(s.level).toBe(2)
    expect(s.currentDay).toBe(31)
    const loanOut = s.activeLoans.reduce((sum, l) => sum + l.amount, 0)
    expect(s.activeLoans).toHaveLength(1)
    expect(s.money).toBe(240000 - loanOut) // fees collected, loan disbursed
  })
})
