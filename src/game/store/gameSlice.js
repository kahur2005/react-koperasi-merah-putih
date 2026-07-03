import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  GAME_STATUS,
  HAPPINESS,
  INITIAL_MEMBERS,
  MISSIONS,
} from '../config.js'
import { PRODUCT_IDS } from '../products.js'
import { allGoodsSafe, computeHappinessDelta, safeStockLevel } from '../mechanics.js'
import { formatCurrency } from '../currency.js'

const SAVE_KEY = 'kopdes-merah-putih-save-v1'

function snapshotState(s) {
  return {
    currentDay: s.currentDay,
    currentMonth: s.currentMonth,
    level: s.level,
    happiness: s.happiness,
    money: s.money,
    totalMembers: s.totalMembers,
    pendingMembers: s.pendingMembers,
    racks: s.racks,
    cashierCount: s.cashierCount,
    placeableCount: s.placeableCount,
    sectors: s.sectors,
    activeLoanRequests: s.activeLoanRequests,
    acceptedLoans: s.acceptedLoans,
    notifications: s.notifications,
    gameStatus: s.gameStatus,
    lossReason: s.lossReason,
    difficulty: s.difficulty,
    completedMissions: s.completedMissions,
    safeStockDays: s.safeStockDays,
    missionToast: s.missionToast,
    lastDaySummary: s.lastDaySummary,
  }
}

export const createGameSlice = (set, get) => ({
  gameStatus: GAME_STATUS.running,
  lossReason: '',
  difficulty: DEFAULT_DIFFICULTY,
  completedMissions: [],
  safeStockDays: 0,
  missionToast: '',
  lastDaySummary: null,

  bootstrap: () => {
    if (get().racks.length > 0) return
    PRODUCT_IDS.forEach((type) => get().addRack(type, { free: true }))
    PRODUCT_IDS.forEach((type) => {
      set((s) => ({
        racks: s.racks.map((r) => (r.itemType === type ? { ...r, currentStock: r.capacity } : r)),
      }))
    })
    get().generateLoanRequests()
    get().checkMissions()
    get().saveGame()
  },

  startDay: (rng = Math.random) => {
    if (get().gameStatus !== GAME_STATUS.running) return
    get().resetDayCustomers()
    get().setGameTime(0)
    get().spawnCustomers(rng)
  },

  endDay: (rng = Math.random) => {
    if (get().gameStatus !== GAME_STATUS.running) return
    const before = {
      money: get().money,
      members: get().totalMembers,
      happiness: get().happiness,
      dayIncome: get().dayIncome,
    }
    get().commitPendingMembers()
    const loanResults = get().resolveAcceptedLoans(rng)
    const delta = computeHappinessDelta(get().stockByProduct(), get().level, get().difficulty)
    set((s) => ({
      safeStockDays: allGoodsSafe(s.stockByProduct(), s.level) ? s.safeStockDays + 1 : 0,
    }))
    get().adjustHappiness(delta)
    if (delta !== 0) get().pushNotification?.(delta > 0 ? 'success' : 'warning', `Daily happiness ${delta > 0 ? '+' : ''}${delta}.`)
    const upgraded = get().upgradeVillage()
    if (upgraded) get().refreshRackCapacities()
    if (get().currentDay % 30 === 0) get().collectMonthlyFees()
    get().generateLoanRequests(rng)
    get().checkMissions()
    set({
      lastDaySummary: {
        day: get().currentDay,
        sales: before.dayIncome,
        moneyChange: get().money - before.money,
        membersGained: get().totalMembers - before.members,
        happinessChange: get().happiness - before.happiness,
        loanResults,
        disappointedCustomers: get().disappointedCustomers,
      },
      showDaySummary: true,
    })
    get().checkWinLose()
    if (get().gameStatus === GAME_STATUS.running) get().advanceDay()
    get().saveGame()
  },

  playOneDay: (rng = Math.random) => {
    if (get().gameStatus !== GAME_STATUS.running) return false
    while (get().queue.length > 0) get().serveCustomer(rng)
    get().endDay(rng)
    if (get().gameStatus === GAME_STATUS.running) get().startDay(rng)
    return true
  },

  restockToSafe: (supplier = 'company') => {
    PRODUCT_IDS.forEach((id) => {
      const stock = get().stockOf(id)
      const safe = safeStockLevel(id, get().level)
      if (stock < safe) get().restockItem(id, safe - stock, supplier)
    })
    get().checkMissions()
    get().saveGame()
  },

  checkMissions: () => {
    const s = get()
    const completed = new Set(s.completedMissions)
    const newlyCompleted = []
    const stockByProduct = s.stockByProduct()
    MISSIONS.forEach((mission) => {
      if (completed.has(mission.id)) return
      const done =
        (mission.id === 'stable-stock' && s.safeStockDays >= 5) ||
        (mission.id === 'local-rice' && s.sectors.rice.level >= 1) ||
        (mission.id === 'member-200' && s.totalMembers >= 200) ||
        (mission.id === 'happy-village' && s.happiness >= 85)
      if (!done) return
      completed.add(mission.id)
      newlyCompleted.push(mission)
      if (mission.reward.money) s.addMoney(mission.reward.money)
      if (mission.reward.happiness) s.adjustHappiness(mission.reward.happiness)
      if (mission.reward.members) s.adjustMembers(mission.reward.members)
      s.pushNotification?.('success', `Mission complete: ${mission.title}.`)
    })
    if (newlyCompleted.length > 0) {
      set({ completedMissions: [...completed], missionToast: newlyCompleted.at(-1).title })
    }
    return newlyCompleted
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

  scorecard: () => {
    const s = get()
    const completed = s.completedMissions.length
    const loanSuccesses = PRODUCT_IDS.reduce((sum, id) => sum + (s.sectors[id]?.successfulLoans ?? 0), 0)
    const loanFailures = PRODUCT_IDS.reduce((sum, id) => sum + (s.sectors[id]?.failedLoans ?? 0), 0)
    const title =
      s.gameStatus === GAME_STATUS.won
        ? 'Village Hero'
        : loanSuccesses >= loanFailures
          ? 'Smart Treasurer'
          : 'Risky Banker'
    return {
      title,
      day: s.currentDay,
      money: s.money,
      members: s.totalMembers,
      happiness: s.happiness,
      completedMissions: completed,
      loanSuccessRate: loanSuccesses + loanFailures === 0 ? 0 : Math.round((loanSuccesses / (loanSuccesses + loanFailures)) * 100),
    }
  },

  setDifficulty: (difficulty) => {
    if (!DIFFICULTIES[difficulty]) return false
    set({ difficulty })
    return true
  },

  resetGame: (difficulty = get().difficulty) => {
    const mode = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal
    set({
      currentDay: 1,
      currentMonth: 1,
      gameTime: 0,
      isRunning: false,
      level: 1,
      happiness: mode.initialHappiness,
      money: mode.initialMoney,
      formattedMoney: formatCurrency(mode.initialMoney),
      totalMembers: INITIAL_MEMBERS,
      pendingMembers: 0,
      racks: [],
      cashierCount: 1,
      placeableCount: 0,
      currentCustomers: 0,
      queue: [],
      dayIncome: 0,
      disappointedCustomers: 0,
      activeLoanRequests: [],
      acceptedLoans: [],
      gameStatus: GAME_STATUS.running,
      lossReason: '',
      difficulty,
      completedMissions: [],
      safeStockDays: 0,
      missionToast: '',
      lastDaySummary: null,
      notifications: [],
      showDaySummary: false,
    })
    get().resetSectors()
    get().bootstrap()
    get().saveGame()
    return true
  },

  saveGame: () => {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotState(get())))
    return true
  },

  loadGame: () => {
    if (typeof localStorage === 'undefined') return false
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    set({
      ...data,
      formattedMoney: formatCurrency(data.money),
      isRunning: false,
      showDaySummary: false,
    })
    return true
  },
})
