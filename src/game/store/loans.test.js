import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

function seedLoanState() {
  useGameStore.setState({
    level: 1,
    currentDay: 3,
    money: 5000000,
    formattedMoney: formatCurrency(5000000),
    happiness: 70,
    totalMembers: 100,
    activeLoanRequests: [],
    acceptedLoans: [],
    notifications: [],
    sectors: {
      rice: { id: 'rice', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      fruit: { id: 'fruit', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
      gas: { id: 'gas', level: 0, maxLevel: 5, successfulLoans: 0, failedLoans: 0 },
    },
  })
}

beforeEach(seedLoanState)

describe('loan requests', () => {
  it('generates one level-1 request every 3 days', () => {
    const requests = useGameStore.getState().generateLoanRequests(() => 0)
    expect(requests).toHaveLength(1)
    expect(useGameStore.getState().activeLoanRequests).toHaveLength(1)
    expect(requests[0].riskScore).toBeGreaterThanOrEqual(0)
  })

  it('accepts a loan and debits cooperative money', () => {
    useGameStore.setState({
      activeLoanRequests: [{
        id: 'loan-a',
        applicant: 'Sari',
        sectorType: 'rice',
        loanAmount: 1000000,
        riskScore: 10,
        riskLabel: 'Low Risk',
        potentialVillageImpact: 'high',
      }],
    })
    expect(useGameStore.getState().acceptLoan('loan-a')).toBe(true)
    expect(useGameStore.getState().money).toBe(4000000)
    expect(useGameStore.getState().activeLoanRequests).toHaveLength(0)
    expect(useGameStore.getState().acceptedLoans[0].dueDay).toBe(6)
  })

  it('rejects high-risk loans with a small happiness gain', () => {
    useGameStore.setState({
      activeLoanRequests: [{
        id: 'loan-b',
        applicant: 'Budi',
        sectorType: 'gas',
        loanAmount: 1000000,
        riskScore: 80,
        riskLabel: 'High Risk',
      }],
    })
    expect(useGameStore.getState().rejectLoan('loan-b')).toBe(true)
    expect(useGameStore.getState().happiness).toBe(71)
  })

  it('successful accepted loans improve sectors and local supplier prices', () => {
    useGameStore.setState({
      currentDay: 6,
      acceptedLoans: [{
        id: 'loan-c',
        applicant: 'Dewi',
        sectorType: 'rice',
        loanAmount: 1000000,
        riskScore: 0,
        potentialVillageImpact: 'high',
        dueDay: 6,
      }],
    })
    const result = useGameStore.getState().resolveAcceptedLoans(() => 0)
    expect(result.succeeded).toBe(1)
    expect(useGameStore.getState().sectors.rice.level).toBe(1)
    expect(useGameStore.getState().localSupplierPrice('rice')).toBe(9500)
    expect(useGameStore.getState().money).toBe(5100000)
    expect(useGameStore.getState().happiness).toBe(73)
  })
})
