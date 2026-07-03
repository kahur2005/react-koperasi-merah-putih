import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({ money: 5000000, formattedMoney: formatCurrency(5000000), currentDay: 1, currentMonth: 1 })
})

describe('economy slice', () => {
  it('starts from the MVP campaign budget', () => {
    const s = useGameStore.getState()
    expect(s.money).toBe(5000000)
    expect(s.formattedMoney).toBe('Rp 5.000.000')
  })

  it('addMoney updates formattedMoney synchronously', () => {
    useGameStore.getState().addMoney(35000)
    expect(useGameStore.getState().formattedMoney).toBe('Rp 5.035.000')
  })

  it('spendMoney fails when insufficient', () => {
    expect(useGameStore.getState().spendMoney(9999999)).toBe(false)
    expect(useGameStore.getState().money).toBe(5000000)
  })
})

describe('time slice', () => {
  it('advanceDay bumps day and recomputes month at 30-day boundaries', () => {
    useGameStore.setState({ currentDay: 30 })
    useGameStore.getState().advanceDay()
    expect(useGameStore.getState().currentDay).toBe(31)
    expect(useGameStore.getState().currentMonth).toBe(2)
  })
})
