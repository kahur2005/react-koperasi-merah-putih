import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({
    money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 20, currentDay: 30, activeLoans: [],
  })
})

describe('processLoans', () => {
  it('issues loans for 5% of members and debits coop cash', () => {
    // 20 members * 5% = 1 borrower; rng 0 -> min amount 5000
    const res = useGameStore.getState().processLoans(() => 0)
    expect(res.issued).toBe(1)
    expect(useGameStore.getState().activeLoans.length).toBe(1)
    expect(useGameStore.getState().activeLoans[0].dueDay).toBe(60)
    expect(useGameStore.getState().money).toBe(195000) // 200000 - 5000
  })
  it('repays matured loans with 5% interest', () => {
    useGameStore.setState({
      currentDay: 60,
      activeLoans: [{ id: 'l1', memberId: 0, amount: 10000, dueDay: 60, interestRate: 0.05 }],
      totalMembers: 0,
    })
    const res = useGameStore.getState().processLoans(() => 0)
    expect(res.repaid).toBe(1)
    expect(useGameStore.getState().money).toBe(210500) // +10000*1.05
    expect(useGameStore.getState().activeLoans.length).toBe(0)
  })
})
