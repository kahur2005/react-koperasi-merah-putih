import { HAPPINESS, LOANS } from '../config.js'
import { computeLoanRisk, loanSuccessChance, riskLabel } from '../mechanics.js'

let loanCounter = 0

const NAMES = ['Sari', 'Budi', 'Wayan', 'Aminah', 'Raka', 'Dewi', 'Hasan', 'Mira']

const JOBS = {
  rice: ['Rice Farmer', 'Mill Worker', 'Shop Clerk'],
  fruit: ['Fruit Farmer', 'Market Seller', 'Driver'],
  gas: ['Gas Seller', 'Distributor Helper', 'Food Stall Owner'],
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)]
}

function createLoanRequest(day, level, difficulty, rng = Math.random) {
  const sectors = ['rice', 'fruit', 'gas']
  const sectorType = pick(sectors, rng)
  const aligned = rng() < 0.65
  const job = aligned ? JOBS[sectorType][0] : pick(JOBS[sectorType].slice(1), rng)
  const monthlyIncome = Math.round((1200000 + rng() * 3800000 + level * 350000) / 50000) * 50000
  const loanAmount = Math.round((monthlyIncome * (1 + rng() * (level + 3))) / 50000) * 50000
  const crimeHistory = pick(['none', 'none', 'none', 'minor', level >= 2 ? 'serious' : 'none'], rng)
  const repaymentHistory = pick(['good', 'average', 'none', level >= 2 ? 'bad' : 'average'], rng)
  const potentialVillageImpact = pick(['low', 'medium', 'high'], rng)
  const jobSectorFit = aligned ? 'match' : rng() < 0.5 ? 'related' : 'unrelated'
  const incomeStability = aligned || rng() < 0.55 ? 'stable' : 'unstable'
  const base = {
    id: `loan-${++loanCounter}`,
    applicant: pick(NAMES, rng),
    age: Math.floor(22 + rng() * 38),
    job,
    monthlyIncome,
    loanAmount,
    purpose: `Develop ${sectorType} production`,
    sectorType,
    crimeHistory,
    repaymentHistory,
    potentialVillageImpact,
    jobSectorFit,
    incomeStability,
    requestedDay: day,
    status: 'pending',
  }
  const riskScore = computeLoanRisk(base, difficulty)
  return { ...base, riskScore, riskLabel: riskLabel(riskScore) }
}

export const createLoansSlice = (set, get) => ({
  activeLoanRequests: [],
  acceptedLoans: [],

  generateLoanRequests: (rng = Math.random) => {
    const { level, currentDay, difficulty } = get()
    const rule = LOANS.requestFrequency[level]
    if (!rule || currentDay % rule.everyDays !== 0) return []
    const requests = Array.from({ length: rule.count }, () => createLoanRequest(currentDay, level, difficulty, rng))
    set((s) => ({ activeLoanRequests: [...s.activeLoanRequests, ...requests].slice(-6) }))
    return requests
  },

  acceptLoan: (loanId) => {
    const loan = get().activeLoanRequests.find((l) => l.id === loanId)
    if (!loan) return false
    if (!get().spendMoney(loan.loanAmount)) {
      get().pushNotification?.('warning', `Not enough money to fund ${loan.applicant}'s loan.`)
      return false
    }
    const accepted = { ...loan, status: 'accepted', dueDay: get().currentDay + LOANS.resolutionDays }
    set((s) => ({
      activeLoanRequests: s.activeLoanRequests.filter((l) => l.id !== loanId),
      acceptedLoans: [...s.acceptedLoans, accepted],
    }))
    get().pushNotification?.('loan', `${loan.applicant}'s ${loan.sectorType} loan accepted.`)
    return true
  },

  rejectLoan: (loanId) => {
    const loan = get().activeLoanRequests.find((l) => l.id === loanId)
    if (!loan) return false
    set((s) => ({ activeLoanRequests: s.activeLoanRequests.filter((l) => l.id !== loanId) }))
    if (loan.riskScore > LOANS.riskLabels.mediumMax) {
      get().adjustHappiness(HAPPINESS.correctRejection)
      get().pushNotification?.('loan', `Rejected high-risk loan from ${loan.applicant}. Happiness +1.`)
    } else {
      get().pushNotification?.('loan', `Rejected ${loan.applicant}'s loan. Sector growth opportunity missed.`)
    }
    return true
  },

  resolveAcceptedLoans: (rng = Math.random) => {
    const due = get().acceptedLoans.filter((l) => l.dueDay <= get().currentDay)
    if (due.length === 0) return { succeeded: 0, failed: 0 }
    let succeeded = 0
    let failed = 0
    due.forEach((loan) => {
      if (rng() < loanSuccessChance(loan)) {
        succeeded += 1
        get().improveSector(loan.sectorType)
        get().addMoney(Math.round(loan.loanAmount * 0.1))
        get().adjustHappiness(HAPPINESS.successfulLoan)
        get().adjustMembers(3 + Math.floor(rng() * 6))
        get().pushNotification?.('success', `${loan.applicant}'s ${loan.sectorType} loan succeeded. Sector +1.`)
      } else {
        failed += 1
        get().recordSectorFailure(loan.sectorType)
        get().adjustHappiness(HAPPINESS.failedLoan)
        get().adjustMembers(-(2 + Math.floor(rng() * 4)))
        get().pushNotification?.('danger', `${loan.applicant}'s ${loan.sectorType} loan failed.`)
      }
    })
    set((s) => ({ acceptedLoans: s.acceptedLoans.filter((l) => l.dueDay > s.currentDay) }))
    return { succeeded, failed }
  },
})
