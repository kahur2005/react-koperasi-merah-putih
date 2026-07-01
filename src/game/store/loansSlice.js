import { LOANS } from '../config.js'

let loanCounter = 0

export const createLoansSlice = (set, get) => ({
  activeLoans: [],

  // Called every 30 days: repay matured loans (+interest), then issue new ones.
  processLoans: (rng = Math.random) => {
    const { totalMembers, currentDay } = get()
    const due = get().activeLoans.filter((l) => l.dueDay <= currentDay)
    due.forEach((l) => get().addMoney(Math.round(l.amount * (1 + l.interestRate))))

    let remaining = get().activeLoans.filter((l) => l.dueDay > currentDay)
    const borrowers = Math.floor(totalMembers * LOANS.borrowerRate)
    let issued = 0
    for (let i = 0; i < borrowers; i++) {
      const amount = Math.floor(rng() * (LOANS.maxAmount - LOANS.minAmount + 1)) + LOANS.minAmount
      if (!get().spendMoney(amount)) break // coop lends from its own cash
      remaining = [
        ...remaining,
        { id: `loan-${++loanCounter}`, memberId: i, amount, dueDay: currentDay + LOANS.termDays, interestRate: LOANS.interestRate },
      ]
      issued += 1
    }
    set({ activeLoans: remaining })
    return { repaid: due.length, issued }
  },
})
