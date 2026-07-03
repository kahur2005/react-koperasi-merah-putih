import { describe, it, expect } from 'vitest'
import {
  computeDailyCustomerCount,
  computeHappinessDelta,
  computeLoanRisk,
  computeLocalSupplierPrice,
  computeMembershipChance,
  loanSuccessChance,
  safeStockLevel,
  stockStatus,
} from './mechanics.js'

describe('stock and happiness formulas', () => {
  it('computes safe levels and stock status', () => {
    expect(safeStockLevel('rice', 1)).toBe(30)
    expect(stockStatus('rice', 0, 1)).toBe('critical')
    expect(stockStatus('rice', 10, 1)).toBe('warning')
    expect(stockStatus('rice', 30, 1)).toBe('safe')
  })

  it('penalizes empty essentials more than fruit', () => {
    expect(computeHappinessDelta({ rice: 0, fruit: 0, gas: 0 }, 1)).toBe(-19)
  })

  it('rewards all goods above safe stock', () => {
    expect(computeHappinessDelta({ rice: 30, fruit: 20, gas: 18 }, 1)).toBe(2)
  })
})

describe('customer and supplier formulas', () => {
  it('scales customer count by level range and happiness', () => {
    expect(computeDailyCustomerCount(1, 50, () => 0)).toBe(8)
    expect(computeDailyCustomerCount(3, 100, () => 0)).toBe(34)
  })

  it('computes local supplier discount by sector level', () => {
    expect(computeLocalSupplierPrice('rice', 0)).toBe(10000)
    expect(computeLocalSupplierPrice('rice', 3)).toBe(8500)
    expect(computeLocalSupplierPrice('rice', 99)).toBe(7000)
  })

  it('computes membership conversion chance from happiness and stock safety', () => {
    expect(computeMembershipChance({ happiness: 70, allGoodsSafe: false, anyEssentialEmpty: false })).toBeCloseTo(0.05)
    expect(computeMembershipChance({ happiness: 80, allGoodsSafe: true, anyEssentialEmpty: false })).toBeCloseTo(0.13)
    expect(computeMembershipChance({ happiness: 80, allGoodsSafe: true, anyEssentialEmpty: true })).toBeCloseTo(0.05)
  })
})

describe('loan formulas', () => {
  it('scores safe sector-aligned applicants as low risk', () => {
    const score = computeLoanRisk({
      loanAmount: 1000000,
      monthlyIncome: 2000000,
      crimeHistory: 'none',
      repaymentHistory: 'good',
      jobSectorFit: 'match',
      incomeStability: 'stable',
      potentialVillageImpact: 'high',
    })
    expect(score).toBe(0)
  })

  it('scores overextended bad-history applicants as high risk', () => {
    const score = computeLoanRisk({
      loanAmount: 9000000,
      monthlyIncome: 1000000,
      crimeHistory: 'serious',
      repaymentHistory: 'bad',
      jobSectorFit: 'unrelated',
      incomeStability: 'unstable',
      potentialVillageImpact: 'low',
    })
    expect(score).toBe(100)
  })

  it('converts loan risk into bounded success chance', () => {
    expect(loanSuccessChance({ riskScore: 0, potentialVillageImpact: 'high' })).toBe(0.95)
    expect(loanSuccessChance({ riskScore: 100, potentialVillageImpact: 'low' })).toBeCloseTo(0.15)
  })
})
