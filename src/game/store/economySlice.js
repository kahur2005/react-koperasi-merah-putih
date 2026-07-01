import { INITIAL_MONEY } from '../config.js'
import { formatCurrency } from '../currency.js'

export const createEconomySlice = (set, get) => ({
  money: INITIAL_MONEY,
  formattedMoney: formatCurrency(INITIAL_MONEY),

  addMoney: (amount) =>
    set((s) => {
      const money = s.money + amount
      return { money, formattedMoney: formatCurrency(money) }
    }),

  spendMoney: (amount) => {
    const { money } = get()
    if (money < amount) return false
    const next = money - amount
    set({ money: next, formattedMoney: formatCurrency(next) })
    return true
  },
})
