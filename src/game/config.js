// All tunable game constants. Balance the MVP by editing this file.

export const INITIAL_MONEY = 5000000
export const GAME_DAYS = 90
export const DAY_DURATION_MS = 300000 // 5 real minutes = 1 in-game day
export const CASHIER_INTERVAL_MS = 5000 // each cashier serves 1 customer / 5s
export const MONTHLY_INTERVAL_DAYS = 30

export const INITIAL_MEMBERS = 100
export const MEMBER_MONTHLY_FEE = 2000

export const HAPPINESS = {
  min: 0,
  max: 100,
  start: 70,
  allSafeBonus: 2,
  belowSafePenalty: {
    rice: -3,
    fruit: -1,
    gas: -3,
  },
  emptyPenalty: {
    rice: -8,
    fruit: -3,
    gas: -8,
  },
  successfulLoan: 3,
  failedLoan: -4,
  correctRejection: 1,
}

export const VILLAGE = {
  1: {
    name: 'Small Village Cooperative',
    memberRequirement: 100,
    capacityModifier: 1,
    maxRacks: 3,
    maxCashiers: 1,
    maxPlaceables: 4,
    customerRange: [8, 14],
  },
  2: {
    name: 'Growing Cooperative',
    memberRequirement: 300,
    capacityModifier: 1.5,
    maxRacks: 5,
    maxCashiers: 2,
    maxPlaceables: 8,
    customerRange: [14, 24],
  },
  3: {
    name: 'Advanced Cooperative',
    memberRequirement: 500,
    capacityModifier: 2,
    maxRacks: 8,
    maxCashiers: 3,
    maxPlaceables: 12,
    customerRange: [24, 38],
  },
}

export const UPGRADE_REQUIREMENTS = {
  2: { members: 300 },
  3: { members: 500 },
}

export const FACILITY_COSTS = {
  rack: 250000,
  cashier: 750000,
  placeable: 150000,
}

export const MEMBERSHIP = {
  base: 0.05,
  highHappinessBonus: 0.04,
  allSafeBonus: 0.04,
  essentialEmptyPenalty: 0.08,
  max: 0.15,
}

export const CUSTOMER_DEMAND_WEIGHTS = {
  rice: 0.4,
  fruit: 0.3,
  gas: 0.3,
}

export const SECTORS = {
  maxLevel: 5,
  discountPerLevel: 0.05,
  maxDiscount: 0.3,
  gasMarginPerLevel: 300,
}

export const LOANS = {
  resolutionDays: 3,
  requestFrequency: {
    1: { everyDays: 3, count: 1 },
    2: { everyDays: 2, count: 1 },
    3: { everyDays: 1, count: 2 },
  },
  riskLabels: {
    lowMax: 30,
    mediumMax: 60,
  },
}

export const GAME_STATUS = {
  running: 'running',
  won: 'won',
  lost: 'lost',
}

export const DIFFICULTIES = {
  santai: {
    id: 'santai',
    label: 'Santai',
    initialMoney: 6500000,
    initialHappiness: 80,
    happinessLossMultiplier: 0.7,
    loanRiskOffset: -8,
    memberGoalBonus: 1.15,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    initialMoney: INITIAL_MONEY,
    initialHappiness: HAPPINESS.start,
    happinessLossMultiplier: 1,
    loanRiskOffset: 0,
    memberGoalBonus: 1,
  },
  tantangan: {
    id: 'tantangan',
    label: 'Tantangan',
    initialMoney: 4000000,
    initialHappiness: 65,
    happinessLossMultiplier: 1.25,
    loanRiskOffset: 8,
    memberGoalBonus: 0.9,
  },
}

export const DEFAULT_DIFFICULTY = 'normal'

export const MISSIONS = [
  {
    id: 'stable-stock',
    title: 'Stok Aman',
    description: 'Keep rice, fruit, and gas above safe stock for 5 days.',
    reward: { money: 150000, happiness: 2 },
  },
  {
    id: 'local-rice',
    title: 'Dukung Petani Beras',
    description: 'Reach Rice Sector Level 1.',
    reward: { members: 8, happiness: 2 },
  },
  {
    id: 'member-200',
    title: 'Anggota Makin Ramai',
    description: 'Reach 200 cooperative members.',
    reward: { money: 250000 },
  },
  {
    id: 'happy-village',
    title: 'Desa Bahagia',
    description: 'Raise happiness to 85%.',
    reward: { members: 10 },
  },
]

export const TUTORIAL_STEPS = [
  'Keep rice and gas stocked. They affect village happiness the most.',
  'Company suppliers are reliable. Local suppliers become cheaper when sectors grow.',
  'Loan decisions improve local production, but risky loans can drain money.',
  'Complete missions and reach 500 members before Day 90.',
]
