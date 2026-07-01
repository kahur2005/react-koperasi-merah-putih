import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ money: 200000, formattedMoney: 'Rp 200.000', currentDay: 1, currentMonth: 1 })
})

describe('economy slice', () => {
  it('starts at Rp 200.000', () => {
    const s = useGameStore.getState()
    expect(s.money).toBe(200000)
    expect(s.formattedMoney).toBe('Rp 200.000')
  })
  it('addMoney updates formattedMoney synchronously', () => {
    useGameStore.getState().addMoney(35000)
    expect(useGameStore.getState().formattedMoney).toBe('Rp 235.000')
  })
  it('spendMoney fails when insufficient', () => {
    expect(useGameStore.getState().spendMoney(999999)).toBe(false)
    expect(useGameStore.getState().money).toBe(200000)
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
