import { MONTHLY_INTERVAL_DAYS, REPUTATION } from '../config.js'

export const createGameSlice = (set, get) => ({
  // Seed level-1 facilities (4 racks, one per product) so the sim can run.
  bootstrap: () => {
    if (get().racks.length > 0) return
    const seed = ['rice', 'gas', 'veggies', 'umkm']
    seed.forEach((type) => get().addRack(type))
    seed.forEach((type) => get().restockItem(type, 20))
  },

  startDay: (rng = Math.random) => {
    get().resetDayCustomers()
    get().setGameTime(0)
    if (get().requiredStockEmpty()) get().adjustReputation(REPUTATION.stockoutDelta)
    get().spawnCustomers(rng)
  },

  endDay: () => {
    get().commitPendingMembers()
    get().upgradeVillage()
    const day = get().currentDay
    if (day % MONTHLY_INTERVAL_DAYS === 0) {
      get().collectMonthlyFees()
      get().processLoans()
    }
    get().advanceDay()
  },
})
