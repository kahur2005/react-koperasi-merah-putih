// All tunable game constants. Balance the game by editing this file only.

export const INITIAL_MONEY = 200000
export const GAME_DAYS = 365
export const DAY_DURATION_MS = 300000 // 5 real minutes = 1 in-game day
export const CASHIER_INTERVAL_MS = 5000 // each cashier serves 1 customer / 5s
export const MONTHLY_INTERVAL_DAYS = 30

export const RACK_CAPACITY = 20

// Village level -> display name + fixed facility caps.
export const VILLAGE = {
  1: { name: 'Desa Miskin', maxRacks: 4, maxCashiers: 1 },
  2: { name: 'Desa Menengah', maxRacks: 6, maxCashiers: 2 },
  3: { name: 'Desa Maju', maxRacks: 8, maxCashiers: 3 },
}

// Requirements to reach a given level (keyed by the target level).
export const UPGRADE_REQUIREMENTS = {
  2: { money: 200000, members: 20 },
  3: { money: 500000, members: 50 },
}

export const MEMBERSHIP = {
  base: 0.4,
  fullStockBonus: 0.1,
  fastQueueBonus: 0.05,
}

export const MEMBER_MONTHLY_FEE = 2000

export const LOANS = {
  borrowerRate: 0.05, // 5% of members borrow each month
  minAmount: 5000,
  maxAmount: 30000,
  interestRate: 0.05, // repay amount * 1.05
  termDays: 30,
}

export const REPUTATION = {
  min: 0,
  max: 100,
  start: 50,
  successDelta: 1,
  failDelta: -2,
  stockoutDelta: -3,
  // Bands drive daily customer spawn range [min, spawnMax].
  bands: {
    low: { threshold: 33, min: 5, spawnMax: 8 },
    mid: { threshold: 66, min: 8, spawnMax: 15 },
    high: { threshold: 100, min: 15, spawnMax: 25 },
  },
}

// When rice OR gas is empty, multiply the day's spawn count by this.
export const STOCKOUT_SPAWN_PENALTY = 0.5
// Queue length below this counts as a "fast queue" for the membership bonus.
export const FAST_QUEUE_THRESHOLD = 3
