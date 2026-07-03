import { GAME_STATUS, HAPPINESS } from '../config.js'
import { PRODUCT_IDS } from '../products.js'
import { computeHappinessDelta } from '../mechanics.js'

export const createGameSlice = (set, get) => ({
  gameStatus: GAME_STATUS.running,
  lossReason: '',

  bootstrap: () => {
    if (get().racks.length > 0) return
    PRODUCT_IDS.forEach((type) => get().addRack(type, { free: true }))
    PRODUCT_IDS.forEach((type) => {
      set((s) => ({
        racks: s.racks.map((r) => (r.itemType === type ? { ...r, currentStock: r.capacity } : r)),
      }))
    })
    get().generateLoanRequests()
  },

  startDay: (rng = Math.random) => {
    if (get().gameStatus !== GAME_STATUS.running) return
    get().resetDayCustomers()
    get().setGameTime(0)
    get().spawnCustomers(rng)
  },

  endDay: (rng = Math.random) => {
    if (get().gameStatus !== GAME_STATUS.running) return
    get().commitPendingMembers()
    get().resolveAcceptedLoans(rng)
    const delta = computeHappinessDelta(get().stockByProduct(), get().level)
    get().adjustHappiness(delta)
    if (delta !== 0) get().pushNotification?.(delta > 0 ? 'success' : 'warning', `Daily happiness ${delta > 0 ? '+' : ''}${delta}.`)
    const upgraded = get().upgradeVillage()
    if (upgraded) get().refreshRackCapacities()
    if (get().currentDay % 30 === 0) get().collectMonthlyFees()
    get().generateLoanRequests(rng)
    get().checkWinLose()
    if (get().gameStatus === GAME_STATUS.running) get().advanceDay()
  },

  checkWinLose: () => {
    const s = get()
    if (s.level === 3 && s.totalMembers >= 500 && s.happiness > 50 && s.money > 0) {
      set({ gameStatus: GAME_STATUS.won, lossReason: '' })
      s.pushNotification?.('success', 'Kopdes Merah Putih reached Level 3 with a stable village economy.')
      return GAME_STATUS.won
    }
    if (s.happiness <= HAPPINESS.min) {
      set({ gameStatus: GAME_STATUS.lost, lossReason: 'People happiness reached 0%.' })
      return GAME_STATUS.lost
    }
    if (s.currentDay >= 90) {
      set({ gameStatus: GAME_STATUS.lost, lossReason: 'Campaign ended before reaching the target.' })
      return GAME_STATUS.lost
    }
    if (s.money <= 0 && s.requiredStockEmpty()) {
      set({ gameStatus: GAME_STATUS.lost, lossReason: 'The cooperative cannot restock essential goods.' })
      return GAME_STATUS.lost
    }
    return GAME_STATUS.running
  },
})
