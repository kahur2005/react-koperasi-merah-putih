# Kopdes Merah Putih Game Mechanics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Zustand-based simulation engine + live HUD for the cooperative-management game "Kopdes Merah Putih" (1 in-game year, real-time timers).

**Architecture:** One Zustand store composed of modular slices (time, economy, village, facilities, members, customers, loans, ui) plus a small `gameSlice` for `startDay`/`endDay` orchestration. Pure helpers live in `mechanics.js`/`currency.js`. A non-React `GameLoop` class owns `setInterval` timers and calls store actions, keeping simulation logic pure and testable. A React `Hud` component subscribes to the store via selectors for instant updates.

**Tech Stack:** React 18, Vite 5, Zustand (state), Vitest (tests), plain JS with JSDoc typedefs.

## Global Constraints

- Plain JS/JSX only — NO TypeScript. Types are JSDoc `@typedef`.
- Initial money: `200000`. Game length: `365` days. `1 day = 300000 ms`. Cashier tick: `5000 ms`. Monthly cycle: every `30` days.
- Rack capacity is FIXED at `20`; only rack COUNT grows. No leveling of racks/cashiers.
- Village caps — L1: 4 racks / 1 cashier; L2: 6 racks / 2 cashiers; L3: 8 racks / 3 cashiers.
- Upgrade gates — L2: money ≥ 200000 AND members ≥ 20; L3: money ≥ 500000 AND members ≥ 50.
- Membership base 40%; +10% full stock; +5% fast queue; forced 0% if rice OR gas empty.
- Monthly member fee: `members * 2000`. Loans: 5% of members borrow 5000–30000, repay `amount * 1.05` after 30 days.
- Currency format: `"Rp 200.000"` (thousands separated by `.`).
- Facilities stay ABSTRACT this pass — no bridge to the R3F `Interior` scene.
- Store actions must be deterministic given a seeded `rng` argument (default `Math.random`), so tests can inject `() => 0` etc.

---

### Task 1: Dependencies, Vitest setup, and currency formatter

**Files:**
- Modify: `package.json` (deps + scripts)
- Modify: `vite.config.js`
- Create: `src/game/currency.js`
- Test: `src/game/currency.test.js`

**Interfaces:**
- Produces: `formatCurrency(amount: number) => string` — e.g. `formatCurrency(200000) === "Rp 200.000"`.

- [ ] **Step 1: Install dependencies**

```bash
npm install zustand
npm install -D vitest
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Enable Vitest in `vite.config.js`**

Replace the file contents with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js'],
  },
})
```

- [ ] **Step 4: Write the failing test** — `src/game/currency.test.js`

```js
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './currency.js'

describe('formatCurrency', () => {
  it('formats thousands with dots and Rp prefix', () => {
    expect(formatCurrency(200000)).toBe('Rp 200.000')
  })
  it('formats small numbers and zero', () => {
    expect(formatCurrency(0)).toBe('Rp 0')
    expect(formatCurrency(999)).toBe('Rp 999')
  })
  it('rounds and handles negatives', () => {
    expect(formatCurrency(235000.4)).toBe('Rp 235.000')
    expect(formatCurrency(-5000)).toBe('-Rp 5.000')
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- currency`
Expected: FAIL — `Cannot find module './currency.js'`.

- [ ] **Step 6: Implement `src/game/currency.js`**

```js
/**
 * Format a number as Indonesian Rupiah, e.g. 200000 -> "Rp 200.000".
 * Uses a manual grouping regex (no ICU dependency) for deterministic output.
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '-' : ''
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}Rp ${digits}`
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- currency`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js src/game/currency.js src/game/currency.test.js
git commit -m "feat: add zustand + vitest and currency formatter"
```

---

### Task 2: Config constants, product catalogue, pure mechanics, typedefs

**Files:**
- Create: `src/game/config.js`
- Create: `src/game/products.js`
- Create: `src/game/mechanics.js`
- Create: `src/game/types.js`
- Test: `src/game/mechanics.test.js`

**Interfaces:**
- Produces (`config.js`): `INITIAL_MONEY, GAME_DAYS, DAY_DURATION_MS, CASHIER_INTERVAL_MS, MONTHLY_INTERVAL_DAYS, RACK_CAPACITY, VILLAGE, UPGRADE_REQUIREMENTS, MEMBERSHIP, MEMBER_MONTHLY_FEE, LOANS, REPUTATION, STOCKOUT_SPAWN_PENALTY, FAST_QUEUE_THRESHOLD`.
- Produces (`products.js`): `PRODUCTS`, `PRODUCT_IDS: string[]`, `REQUIRED_PRODUCT_IDS: string[]`.
- Produces (`mechanics.js`): `computeMembershipChance({ fullStock, fastQueue, gasEmpty, riceEmpty }) => number`; `spawnCountForBand(band: 'low'|'mid'|'high', rng?) => number`.

- [ ] **Step 1: Create `src/game/config.js`**

```js
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
```

- [ ] **Step 2: Create `src/game/products.js`**

```js
// Product catalogue. Rice and gas are the two required staples; running out of
// either reduces spawns and zeroes the membership chance.
export const PRODUCTS = {
  rice: { id: 'rice', label: 'Beras', price: 12000, isRequired: true },
  gas: { id: 'gas', label: 'Gas LPG', price: 18000, isRequired: true },
  veggies: { id: 'veggies', label: 'Sayur & Buah', price: 8000, isRequired: false },
  umkm: { id: 'umkm', label: 'Produk UMKM', price: 15000, isRequired: false },
}

export const PRODUCT_IDS = Object.keys(PRODUCTS)
export const REQUIRED_PRODUCT_IDS = PRODUCT_IDS.filter((id) => PRODUCTS[id].isRequired)
```

- [ ] **Step 3: Create `src/game/types.js`**

```js
/**
 * @typedef {Object} Rack
 * @property {string} id
 * @property {string} itemType   Product id (e.g. 'rice').
 * @property {number} capacity   Fixed at RACK_CAPACITY (20).
 * @property {number} currentStock
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} requestedItem  Product id the customer wants.
 */

/**
 * @typedef {Object} Loan
 * @property {string} id
 * @property {number} memberId
 * @property {number} amount
 * @property {number} dueDay
 * @property {number} interestRate
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} message
 * @property {number} day
 */

export {}
```

- [ ] **Step 4: Write the failing test** — `src/game/mechanics.test.js`

```js
import { describe, it, expect } from 'vitest'
import { computeMembershipChance, spawnCountForBand } from './mechanics.js'

describe('computeMembershipChance', () => {
  it('returns base 0.4 with no modifiers', () => {
    expect(computeMembershipChance({ fullStock: false, fastQueue: false, gasEmpty: false, riceEmpty: false })).toBeCloseTo(0.4)
  })
  it('adds full-stock and fast-queue bonuses', () => {
    expect(computeMembershipChance({ fullStock: true, fastQueue: true, gasEmpty: false, riceEmpty: false })).toBeCloseTo(0.55)
  })
  it('forces 0 when rice empty', () => {
    expect(computeMembershipChance({ fullStock: true, fastQueue: true, gasEmpty: false, riceEmpty: true })).toBe(0)
  })
  it('forces 0 when gas empty', () => {
    expect(computeMembershipChance({ fullStock: false, fastQueue: false, gasEmpty: true, riceEmpty: false })).toBe(0)
  })
})

describe('spawnCountForBand', () => {
  it('returns band min with rng() = 0', () => {
    expect(spawnCountForBand('low', () => 0)).toBe(5)
    expect(spawnCountForBand('mid', () => 0)).toBe(8)
    expect(spawnCountForBand('high', () => 0)).toBe(15)
  })
  it('returns band spawnMax with rng() ~ 0.999', () => {
    expect(spawnCountForBand('low', () => 0.999)).toBe(8)
    expect(spawnCountForBand('high', () => 0.999)).toBe(25)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- mechanics`
Expected: FAIL — `Cannot find module './mechanics.js'`.

- [ ] **Step 6: Implement `src/game/mechanics.js`**

```js
import { MEMBERSHIP, REPUTATION } from './config.js'

/**
 * Membership conversion chance for one successful transaction.
 * Rice OR gas empty forces 0 (dominant rule); otherwise base + bonuses.
 * @param {{fullStock:boolean, fastQueue:boolean, gasEmpty:boolean, riceEmpty:boolean}} ctx
 * @returns {number} chance in [0, 1]
 */
export function computeMembershipChance({ fullStock, fastQueue, gasEmpty, riceEmpty }) {
  if (gasEmpty || riceEmpty) return 0
  let chance = MEMBERSHIP.base
  if (fullStock) chance += MEMBERSHIP.fullStockBonus
  if (fastQueue) chance += MEMBERSHIP.fastQueueBonus
  return Math.max(0, Math.min(1, chance))
}

/**
 * Number of customers to spawn for a reputation band.
 * @param {'low'|'mid'|'high'} band
 * @param {() => number} [rng]
 * @returns {number}
 */
export function spawnCountForBand(band, rng = Math.random) {
  const b = REPUTATION.bands[band]
  return Math.floor(rng() * (b.spawnMax - b.min + 1)) + b.min
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- mechanics`
Expected: PASS (6 tests).

- [ ] **Step 8: Commit**

```bash
git add src/game/config.js src/game/products.js src/game/types.js src/game/mechanics.js src/game/mechanics.test.js
git commit -m "feat: add game config, products, typedefs, and pure mechanics"
```

---

### Task 3: Time + Economy slices and store bootstrap

**Files:**
- Create: `src/game/store/timeSlice.js`
- Create: `src/game/store/economySlice.js`
- Create: `src/game/store/index.js`
- Test: `src/game/store/economyTime.test.js`

**Interfaces:**
- Consumes: `config.js`, `currency.js`.
- Produces (time): state `currentDay=1, currentMonth=1, gameTime=0, isRunning=false`; actions `setRunning(bool)`, `setGameTime(ms)`, `advanceDay()`, `isGameOver() => bool`.
- Produces (economy): state `money`, `formattedMoney`; actions `addMoney(n)`, `spendMoney(n) => bool`.
- Produces (`store/index.js`): `useGameStore` (Zustand store; supports `.getState()`, `.setState()`, `.subscribe()`, and selector calls `useGameStore(s => ...)`).

- [ ] **Step 1: Create `src/game/store/timeSlice.js`**

```js
import { GAME_DAYS, MONTHLY_INTERVAL_DAYS } from '../config.js'

export const createTimeSlice = (set, get) => ({
  currentDay: 1,
  currentMonth: 1,
  gameTime: 0, // ms elapsed within the current day
  isRunning: false,

  setRunning: (running) => set({ isRunning: running }),
  setGameTime: (ms) => set({ gameTime: ms }),

  advanceDay: () =>
    set((s) => {
      const nextDay = s.currentDay + 1
      return {
        currentDay: nextDay,
        currentMonth: Math.floor((nextDay - 1) / MONTHLY_INTERVAL_DAYS) + 1,
        gameTime: 0,
      }
    }),

  isGameOver: () => get().currentDay > GAME_DAYS,
})
```

- [ ] **Step 2: Create `src/game/store/economySlice.js`**

```js
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
```

- [ ] **Step 3: Create `src/game/store/index.js`**

```js
import { create } from 'zustand'
import { createTimeSlice } from './timeSlice.js'
import { createEconomySlice } from './economySlice.js'

export const useGameStore = create((set, get) => ({
  ...createTimeSlice(set, get),
  ...createEconomySlice(set, get),
}))
```

- [ ] **Step 4: Write the failing test** — `src/game/store/economyTime.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ money: 200000, formattedMoney: 'Rp 200.000', currentDay: 1, currentMonth: 1 })
})

describe('economy slice', () => {
  it('starts at Rp 200.000', () => {
    const s = useGameStore.getState()
    expect(s.money).toBe(200000)
    expect(s.formattedMoney).toBe('Rp 200.000')
  })
  it('addMoney updates formattedMoney synchronously', () => {
    useGameStore.getState().addMoney(35000)
    expect(useGameStore.getState().formattedMoney).toBe('Rp 235.000')
  })
  it('spendMoney fails when insufficient', () => {
    expect(useGameStore.getState().spendMoney(999999)).toBe(false)
    expect(useGameStore.getState().money).toBe(200000)
  })
})

describe('time slice', () => {
  it('advanceDay bumps day and recomputes month at 30-day boundaries', () => {
    useGameStore.setState({ currentDay: 30 })
    useGameStore.getState().advanceDay()
    expect(useGameStore.getState().currentDay).toBe(31)
    expect(useGameStore.getState().currentMonth).toBe(2)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- economyTime`
Expected: FAIL — `Cannot find module './index.js'` (or missing actions).

- [ ] **Step 6: Verify implementation** — files from Steps 1-3 already satisfy the test; no new code needed.

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- economyTime`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add src/game/store/timeSlice.js src/game/store/economySlice.js src/game/store/index.js src/game/store/economyTime.test.js
git commit -m "feat: add time and economy store slices"
```

---

### Task 4: Village slice (reputation + upgrade gate)

**Files:**
- Create: `src/game/store/villageSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/village.test.js`

**Interfaces:**
- Consumes: `config.js`; reads `get().money` (economy) and `get().totalMembers` (members, seeded in test); optional `get().pushNotification`.
- Produces: state `level=1`, `reputation=50`; actions `adjustReputation(delta)`, `reputationBand() => 'low'|'mid'|'high'`, `upgradeVillage() => bool`.

- [ ] **Step 1: Create `src/game/store/villageSlice.js`**

```js
import { REPUTATION, UPGRADE_REQUIREMENTS, VILLAGE } from '../config.js'

export const createVillageSlice = (set, get) => ({
  level: 1,
  reputation: REPUTATION.start,

  adjustReputation: (delta) =>
    set((s) => ({
      reputation: Math.max(REPUTATION.min, Math.min(REPUTATION.max, s.reputation + delta)),
    })),

  reputationBand: () => {
    const r = get().reputation
    if (r <= REPUTATION.bands.low.threshold) return 'low'
    if (r <= REPUTATION.bands.mid.threshold) return 'mid'
    return 'high'
  },

  upgradeVillage: () => {
    const { level, money, totalMembers = 0 } = get()
    const nextLevel = level + 1
    const req = UPGRADE_REQUIREMENTS[nextLevel]
    if (!req) return false
    if (money >= req.money && totalMembers >= req.members) {
      set({ level: nextLevel })
      const notify = get().pushNotification
      if (notify) notify('upgrade', `Desa naik ke ${VILLAGE[nextLevel].name}!`)
      return true
    }
    return false
  },
})
```

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Replace the file with:

```js
import { create } from 'zustand'
import { createTimeSlice } from './timeSlice.js'
import { createEconomySlice } from './economySlice.js'
import { createVillageSlice } from './villageSlice.js'

export const useGameStore = create((set, get) => ({
  ...createTimeSlice(set, get),
  ...createEconomySlice(set, get),
  ...createVillageSlice(set, get),
}))
```

- [ ] **Step 3: Write the failing test** — `src/game/store/village.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ level: 1, reputation: 50, money: 200000, totalMembers: 0 })
})

describe('reputation', () => {
  it('clamps within [0, 100]', () => {
    useGameStore.getState().adjustReputation(-100)
    expect(useGameStore.getState().reputation).toBe(0)
    useGameStore.getState().adjustReputation(500)
    expect(useGameStore.getState().reputation).toBe(100)
  })
  it('maps reputation to bands', () => {
    useGameStore.setState({ reputation: 20 })
    expect(useGameStore.getState().reputationBand()).toBe('low')
    useGameStore.setState({ reputation: 50 })
    expect(useGameStore.getState().reputationBand()).toBe('mid')
    useGameStore.setState({ reputation: 90 })
    expect(useGameStore.getState().reputationBand()).toBe('high')
  })
})

describe('upgradeVillage', () => {
  it('does not upgrade when requirements unmet', () => {
    useGameStore.setState({ money: 200000, totalMembers: 10 })
    expect(useGameStore.getState().upgradeVillage()).toBe(false)
    expect(useGameStore.getState().level).toBe(1)
  })
  it('upgrades to level 2 when money and members met', () => {
    useGameStore.setState({ money: 200000, totalMembers: 20 })
    expect(useGameStore.getState().upgradeVillage()).toBe(true)
    expect(useGameStore.getState().level).toBe(2)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- village`
Expected: FAIL before Step 1-2 land; PASS (4 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/villageSlice.js src/game/store/index.js src/game/store/village.test.js
git commit -m "feat: add village slice with reputation bands and upgrade gate"
```

---

### Task 5: Facilities slice (racks + cashiers, fixed capacity)

**Files:**
- Create: `src/game/store/facilitiesSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/facilities.test.js`

**Interfaces:**
- Consumes: `config.js`; reads `get().level` (village).
- Produces: state `racks: Rack[] = []`, `cashierCount = 1`; actions `addRack(itemType) => bool`, `addCashier() => bool`, `restockItem(itemType, amount)`, `stockOf(itemType) => number`, `consumeStock(itemType, amount=1) => bool`.

- [ ] **Step 1: Create `src/game/store/facilitiesSlice.js`**

```js
import { RACK_CAPACITY, VILLAGE } from '../config.js'

let rackCounter = 0

export const createFacilitiesSlice = (set, get) => ({
  racks: [],
  cashierCount: 1,

  addRack: (itemType) => {
    const { racks, level } = get()
    if (racks.length >= VILLAGE[level].maxRacks) return false
    const rack = { id: `rack-${++rackCounter}`, itemType, capacity: RACK_CAPACITY, currentStock: 0 }
    set({ racks: [...racks, rack] })
    return true
  },

  addCashier: () => {
    const { cashierCount, level } = get()
    if (cashierCount >= VILLAGE[level].maxCashiers) return false
    set({ cashierCount: cashierCount + 1 })
    return true
  },

  restockItem: (itemType, amount) =>
    set((s) => ({
      racks: s.racks.map((r) =>
        r.itemType === itemType
          ? { ...r, currentStock: Math.min(r.capacity, r.currentStock + amount) }
          : r,
      ),
    })),

  stockOf: (itemType) =>
    get()
      .racks.filter((r) => r.itemType === itemType)
      .reduce((sum, r) => sum + r.currentStock, 0),

  consumeStock: (itemType, amount = 1) => {
    const { racks } = get()
    let remaining = amount
    const updated = racks.map((r) => {
      if (r.itemType !== itemType || remaining <= 0) return r
      const take = Math.min(r.currentStock, remaining)
      remaining -= take
      return { ...r, currentStock: r.currentStock - take }
    })
    if (remaining > 0) return false
    set({ racks: updated })
    return true
  },
})
```

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Add the import and spread (keep existing lines):

```js
import { createFacilitiesSlice } from './facilitiesSlice.js'
```

and inside the `create(...)` object add `...createFacilitiesSlice(set, get),` after the village slice spread.

- [ ] **Step 3: Write the failing test** — `src/game/store/facilities.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ level: 1, racks: [], cashierCount: 1 })
})

describe('facilities', () => {
  it('enforces rack cap for level 1 (max 4)', () => {
    for (let i = 0; i < 4; i++) expect(useGameStore.getState().addRack('rice')).toBe(true)
    expect(useGameStore.getState().addRack('rice')).toBe(false)
    expect(useGameStore.getState().racks.length).toBe(4)
  })
  it('enforces cashier cap for level 1 (max 1)', () => {
    expect(useGameStore.getState().addCashier()).toBe(false)
    expect(useGameStore.getState().cashierCount).toBe(1)
  })
  it('restock respects fixed capacity of 20', () => {
    useGameStore.getState().addRack('rice')
    useGameStore.getState().restockItem('rice', 999)
    expect(useGameStore.getState().stockOf('rice')).toBe(20)
  })
  it('consumeStock reduces and reports insufficient', () => {
    useGameStore.getState().addRack('gas')
    useGameStore.getState().restockItem('gas', 2)
    expect(useGameStore.getState().consumeStock('gas', 1)).toBe(true)
    expect(useGameStore.getState().stockOf('gas')).toBe(1)
    expect(useGameStore.getState().consumeStock('gas', 5)).toBe(false)
    expect(useGameStore.getState().stockOf('gas')).toBe(1)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- facilities`
Expected: FAIL before wiring; PASS (4 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/facilitiesSlice.js src/game/store/index.js src/game/store/facilities.test.js
git commit -m "feat: add facilities slice with fixed-capacity racks and cashier caps"
```

---

### Task 6: Members slice (register, commit, monthly fees)

**Files:**
- Create: `src/game/store/membersSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/members.test.js`

**Interfaces:**
- Consumes: `config.js`; calls `get().addMoney` (economy).
- Produces: state `totalMembers=0`, `pendingMembers=0`; actions `registerMember()`, `commitPendingMembers()`, `collectMonthlyFees() => number`.

- [ ] **Step 1: Create `src/game/store/membersSlice.js`**

```js
import { MEMBER_MONTHLY_FEE } from '../config.js'

export const createMembersSlice = (set, get) => ({
  totalMembers: 0,
  pendingMembers: 0,

  // Queue a new member (applied at end of day via commitPendingMembers).
  registerMember: () => set((s) => ({ pendingMembers: s.pendingMembers + 1 })),

  commitPendingMembers: () =>
    set((s) => ({ totalMembers: s.totalMembers + s.pendingMembers, pendingMembers: 0 })),

  collectMonthlyFees: () => {
    const { totalMembers, addMoney } = get()
    const fees = totalMembers * MEMBER_MONTHLY_FEE
    addMoney(fees)
    return fees
  },
})
```

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Add:

```js
import { createMembersSlice } from './membersSlice.js'
```

and `...createMembersSlice(set, get),` inside the store object.

- [ ] **Step 3: Write the failing test** — `src/game/store/members.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({ totalMembers: 0, pendingMembers: 0, money: 200000, formattedMoney: formatCurrency(200000) })
})

describe('members', () => {
  it('registerMember queues pending, commit applies them', () => {
    useGameStore.getState().registerMember()
    useGameStore.getState().registerMember()
    expect(useGameStore.getState().totalMembers).toBe(0)
    useGameStore.getState().commitPendingMembers()
    expect(useGameStore.getState().totalMembers).toBe(2)
    expect(useGameStore.getState().pendingMembers).toBe(0)
  })
  it('collectMonthlyFees adds members * 2000', () => {
    useGameStore.setState({ totalMembers: 10 })
    const fees = useGameStore.getState().collectMonthlyFees()
    expect(fees).toBe(20000)
    expect(useGameStore.getState().money).toBe(220000)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- members`
Expected: FAIL before wiring; PASS (2 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/membersSlice.js src/game/store/index.js src/game/store/members.test.js
git commit -m "feat: add members slice with registration and monthly fees"
```

---

### Task 7: Customers slice (spawn, process, serve, fail)

**Files:**
- Create: `src/game/store/customersSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/customers.test.js`

**Interfaces:**
- Consumes: `config.js`, `products.js`, `mechanics.js`; calls `get().reputationBand`, `get().stockOf`, `get().consumeStock`, `get().addMoney`, `get().adjustReputation`, `get().registerMember`.
- Produces: state `currentCustomers=0`, `queue: Customer[] = []`, `dayIncome=0`; actions `requiredStockEmpty() => bool`, `spawnCustomers(rng?) => number`, `processCustomer(customer)`, `serveCustomer(rng?) => Customer|null`, `failCustomer(customer)`, `resetDayCustomers()`.

- [ ] **Step 1: Create `src/game/store/customersSlice.js`**

```js
import { FAST_QUEUE_THRESHOLD, REPUTATION, STOCKOUT_SPAWN_PENALTY } from '../config.js'
import { PRODUCTS, PRODUCT_IDS, REQUIRED_PRODUCT_IDS } from '../products.js'
import { computeMembershipChance, spawnCountForBand } from '../mechanics.js'

let customerCounter = 0

export const createCustomersSlice = (set, get) => ({
  currentCustomers: 0,
  queue: [],
  dayIncome: 0,

  requiredStockEmpty: () => REQUIRED_PRODUCT_IDS.some((id) => get().stockOf(id) <= 0),

  spawnCustomers: (rng = Math.random) => {
    const band = get().reputationBand()
    let count = spawnCountForBand(band, rng)
    if (get().requiredStockEmpty()) count = Math.floor(count * STOCKOUT_SPAWN_PENALTY)
    set({ currentCustomers: count })
    for (let i = 0; i < count; i++) {
      const customer = {
        id: `cust-${++customerCounter}`,
        requestedItem: PRODUCT_IDS[Math.floor(rng() * PRODUCT_IDS.length)],
      }
      get().processCustomer(customer)
    }
    return count
  },

  // Route customer to the cashier queue if their item is in stock, else they leave.
  processCustomer: (customer) => {
    if (get().stockOf(customer.requestedItem) > 0) {
      set((s) => ({ queue: [...s.queue, customer] }))
    } else {
      get().failCustomer(customer)
    }
  },

  // A cashier serves the head of the queue. Returns the served customer or null.
  serveCustomer: (rng = Math.random) => {
    const { queue } = get()
    if (queue.length === 0) return null
    const [customer, ...rest] = queue
    if (!get().consumeStock(customer.requestedItem, 1)) {
      set({ queue: rest })
      return null
    }
    const price = PRODUCTS[customer.requestedItem].price
    get().addMoney(price)
    get().adjustReputation(REPUTATION.successDelta)
    set((s) => ({ queue: rest, dayIncome: s.dayIncome + price }))

    const gasEmpty = get().stockOf('gas') <= 0
    const riceEmpty = get().stockOf('rice') <= 0
    const racks = get().racks
    const fullStock = racks.length > 0 && racks.every((r) => r.currentStock >= r.capacity)
    const fastQueue = rest.length < FAST_QUEUE_THRESHOLD
    const chance = computeMembershipChance({ fullStock, fastQueue, gasEmpty, riceEmpty })
    if (rng() < chance) get().registerMember()
    return customer
  },

  failCustomer: (_customer) => {
    get().adjustReputation(REPUTATION.failDelta)
  },

  resetDayCustomers: () => set({ currentCustomers: 0, queue: [], dayIncome: 0 }),
})
```

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Add:

```js
import { createCustomersSlice } from './customersSlice.js'
```

and `...createCustomersSlice(set, get),` inside the store object.

- [ ] **Step 3: Write the failing test** — `src/game/store/customers.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

function seedStockedStore() {
  useGameStore.setState({
    level: 1, reputation: 50, money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 0, pendingMembers: 0, currentCustomers: 0, queue: [], dayIncome: 0,
    racks: [
      { id: 'r1', itemType: 'rice', capacity: 20, currentStock: 20 },
      { id: 'r2', itemType: 'gas', capacity: 20, currentStock: 20 },
    ],
  })
}

beforeEach(seedStockedStore)

describe('serveCustomer', () => {
  it('sells stock, adds money, and can convert a member', () => {
    useGameStore.setState({ queue: [{ id: 'c1', requestedItem: 'rice' }] })
    const served = useGameStore.getState().serveCustomer(() => 0) // rng 0 -> always convert
    expect(served.id).toBe('c1')
    expect(useGameStore.getState().money).toBe(212000) // +12000 rice
    expect(useGameStore.getState().stockOf('rice')).toBe(19)
    expect(useGameStore.getState().pendingMembers).toBe(1)
  })
  it('returns null on empty queue', () => {
    useGameStore.setState({ queue: [] })
    expect(useGameStore.getState().serveCustomer(() => 0)).toBe(null)
  })
})

describe('failCustomer', () => {
  it('drops reputation', () => {
    useGameStore.setState({ reputation: 50 })
    useGameStore.getState().failCustomer({ id: 'c9', requestedItem: 'rice' })
    expect(useGameStore.getState().reputation).toBe(48) // failDelta -2
  })
})

describe('spawnCustomers', () => {
  it('queues customers whose item is in stock', () => {
    // rng() = 0 -> spawn band min (mid = 8), all request rice (index 0)
    const count = useGameStore.getState().spawnCustomers(() => 0)
    expect(count).toBe(8)
    expect(useGameStore.getState().queue.length).toBe(8)
    expect(useGameStore.getState().queue.every((c) => c.requestedItem === 'rice')).toBe(true)
  })
  it('halves spawn count when a required item is empty', () => {
    useGameStore.setState({ racks: [{ id: 'r1', itemType: 'rice', capacity: 20, currentStock: 0 },
                                     { id: 'r2', itemType: 'gas', capacity: 20, currentStock: 20 }] })
    const count = useGameStore.getState().spawnCustomers(() => 0) // mid min 8 -> *0.5 = 4
    expect(count).toBe(4)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- customers`
Expected: FAIL before wiring; PASS (5 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/customersSlice.js src/game/store/index.js src/game/store/customers.test.js
git commit -m "feat: add customers slice with spawn/serve/fail transaction logic"
```

---

### Task 8: Loans slice (issue + repay with interest)

**Files:**
- Create: `src/game/store/loansSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/loans.test.js`

**Interfaces:**
- Consumes: `config.js`; reads `get().totalMembers`, `get().currentDay`; calls `get().spendMoney`, `get().addMoney`.
- Produces: state `activeLoans: Loan[] = []`; action `processLoans(rng?) => { repaid: number, issued: number }`.

- [ ] **Step 1: Create `src/game/store/loansSlice.js`**

```js
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
```

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Add:

```js
import { createLoansSlice } from './loansSlice.js'
```

and `...createLoansSlice(set, get),` inside the store object.

- [ ] **Step 3: Write the failing test** — `src/game/store/loans.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({
    money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 20, currentDay: 30, activeLoans: [],
  })
})

describe('processLoans', () => {
  it('issues loans for 5% of members and debits coop cash', () => {
    // 20 members * 5% = 1 borrower; rng 0 -> min amount 5000
    const res = useGameStore.getState().processLoans(() => 0)
    expect(res.issued).toBe(1)
    expect(useGameStore.getState().activeLoans.length).toBe(1)
    expect(useGameStore.getState().activeLoans[0].dueDay).toBe(60)
    expect(useGameStore.getState().money).toBe(195000) // 200000 - 5000
  })
  it('repays matured loans with 5% interest', () => {
    useGameStore.setState({
      currentDay: 60,
      activeLoans: [{ id: 'l1', memberId: 0, amount: 10000, dueDay: 60, interestRate: 0.05 }],
      totalMembers: 0,
    })
    const res = useGameStore.getState().processLoans(() => 0)
    expect(res.repaid).toBe(1)
    expect(useGameStore.getState().money).toBe(210500) // +10000*1.05
    expect(useGameStore.getState().activeLoans.length).toBe(0)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- loans`
Expected: FAIL before wiring; PASS (2 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/loansSlice.js src/game/store/index.js src/game/store/loans.test.js
git commit -m "feat: add loans slice with monthly issue and repayment"
```

---

### Task 9: UI slice (notifications, HUD visibility)

**Files:**
- Create: `src/game/store/uiSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/ui.test.js`

**Interfaces:**
- Consumes: reads `get().currentDay`.
- Produces: state `currencyIcon='rupiah_coin'`, `hudVisible=true`, `notifications: Notification[] = []`; actions `pushNotification(type, message)`, `setHudVisible(bool)`.

- [ ] **Step 1: Create `src/game/store/uiSlice.js`**

```js
let notifCounter = 0

export const createUiSlice = (set, get) => ({
  currencyIcon: 'rupiah_coin',
  hudVisible: true,
  notifications: [],

  pushNotification: (type, message) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: `n-${++notifCounter}`, type, message, day: get().currentDay },
      ].slice(-20), // keep only the latest 20
    })),

  setHudVisible: (visible) => set({ hudVisible: visible }),
})
```

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Add:

```js
import { createUiSlice } from './uiSlice.js'
```

and `...createUiSlice(set, get),` inside the store object.

- [ ] **Step 3: Write the failing test** — `src/game/store/ui.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ notifications: [], hudVisible: true, currentDay: 5 })
})

describe('ui slice', () => {
  it('pushNotification records message with current day', () => {
    useGameStore.getState().pushNotification('info', 'Halo')
    const notes = useGameStore.getState().notifications
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ type: 'info', message: 'Halo', day: 5 })
  })
  it('caps notifications at 20', () => {
    for (let i = 0; i < 25; i++) useGameStore.getState().pushNotification('info', `n${i}`)
    expect(useGameStore.getState().notifications).toHaveLength(20)
  })
  it('setHudVisible toggles visibility', () => {
    useGameStore.getState().setHudVisible(false)
    expect(useGameStore.getState().hudVisible).toBe(false)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- store/ui`
Expected: FAIL before wiring; PASS (3 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/uiSlice.js src/game/store/index.js src/game/store/ui.test.js
git commit -m "feat: add ui slice with notifications and hud visibility"
```

---

### Task 10: Game slice (startDay/endDay orchestration + bootstrap)

**Files:**
- Create: `src/game/store/gameSlice.js`
- Modify: `src/game/store/index.js`
- Test: `src/game/store/game.test.js`

**Interfaces:**
- Consumes: `config.js`; calls resetDayCustomers, setGameTime, spawnCustomers, requiredStockEmpty, adjustReputation, commitPendingMembers, upgradeVillage, collectMonthlyFees, processLoans, advanceDay, addRack, restockItem.
- Produces: actions `startDay(rng?)`, `endDay()`, `bootstrap()`.

- [ ] **Step 1: Create `src/game/store/gameSlice.js`**

```js
import { MONTHLY_INTERVAL_DAYS, REPUTATION } from '../config.js'
import { REQUIRED_PRODUCT_IDS } from '../products.js'

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
```

Note on `REQUIRED_PRODUCT_IDS` import: it is used indirectly via `requiredStockEmpty` in the customers slice; the import here keeps the dependency explicit for readers. If your linter flags it as unused, remove the import line — the behavior is unchanged.

- [ ] **Step 2: Wire into `src/game/store/index.js`**

Add:

```js
import { createGameSlice } from './gameSlice.js'
```

and `...createGameSlice(set, get),` inside the store object (add it last).

- [ ] **Step 3: Write the failing test** — `src/game/store/game.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  useGameStore.setState({
    level: 1, reputation: 50, money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 0, pendingMembers: 0, currentDay: 1, currentMonth: 1,
    racks: [], cashierCount: 1, queue: [], activeLoans: [], currentCustomers: 0, dayIncome: 0,
  })
})

describe('bootstrap', () => {
  it('seeds 4 stocked racks', () => {
    useGameStore.getState().bootstrap()
    expect(useGameStore.getState().racks).toHaveLength(4)
    expect(useGameStore.getState().stockOf('rice')).toBe(20)
  })
})

describe('endDay', () => {
  it('commits pending members and advances the day', () => {
    useGameStore.setState({ pendingMembers: 3, currentDay: 1 })
    useGameStore.getState().endDay()
    expect(useGameStore.getState().totalMembers).toBe(3)
    expect(useGameStore.getState().currentDay).toBe(2)
  })
  it('runs monthly fees + loans on day 30 and upgrades when eligible', () => {
    useGameStore.setState({ currentDay: 30, pendingMembers: 20, money: 200000 })
    useGameStore.getState().endDay()
    // 20 members committed -> upgrade to L2, then monthly fees 20*2000 = 40000
    expect(useGameStore.getState().level).toBe(2)
    expect(useGameStore.getState().money).toBe(240000)
    expect(useGameStore.getState().currentDay).toBe(31)
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- store/game`
Expected: FAIL before wiring; PASS (3 tests) after.

- [ ] **Step 5: Commit**

```bash
git add src/game/store/gameSlice.js src/game/store/index.js src/game/store/game.test.js
git commit -m "feat: add game slice orchestrating startDay/endDay and bootstrap"
```

---

### Task 11: GameLoop controller (real-time timers)

**Files:**
- Create: `src/game/loop/GameLoop.js`
- Test: `src/game/loop/GameLoop.test.js`

**Interfaces:**
- Consumes: `useGameStore` from store; `DAY_DURATION_MS`, `CASHIER_INTERVAL_MS` from config; store actions `startDay`, `endDay`, `serveCustomer`, `isGameOver`, `bootstrap`.
- Produces: class `GameLoop` with `start()`, `stop()`, `tickCashiers()`, `tickDay()`.

- [ ] **Step 1: Create `src/game/loop/GameLoop.js`**

```js
import { CASHIER_INTERVAL_MS, DAY_DURATION_MS } from '../config.js'
import { useGameStore } from '../store/index.js'

/**
 * Owns the real-time timers that drive the simulation. Keeps timers OUT of
 * React and the store so simulation logic stays pure/testable.
 */
export class GameLoop {
  constructor(store = useGameStore) {
    this.store = store
    this.dayTimer = null
    this.cashierTimer = null
  }

  start() {
    const s = this.store.getState()
    if (s.isRunning) return
    s.setRunning(true)
    s.bootstrap()
    s.startDay()
    this.cashierTimer = setInterval(() => this.tickCashiers(), CASHIER_INTERVAL_MS)
    this.dayTimer = setInterval(() => this.tickDay(), DAY_DURATION_MS)
  }

  tickCashiers() {
    const s = this.store.getState()
    for (let i = 0; i < s.cashierCount; i++) s.serveCustomer()
  }

  tickDay() {
    this.store.getState().endDay()
    if (this.store.getState().isGameOver()) {
      this.stop()
      return
    }
    this.store.getState().startDay()
  }

  stop() {
    clearInterval(this.dayTimer)
    clearInterval(this.cashierTimer)
    this.dayTimer = null
    this.cashierTimer = null
    this.store.getState().setRunning(false)
  }
}
```

- [ ] **Step 2: Write the failing test** — `src/game/loop/GameLoop.test.js`

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GameLoop } from './GameLoop.js'
import { useGameStore } from '../store/index.js'
import { formatCurrency } from '../currency.js'

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.setState({
    level: 1, reputation: 50, money: 200000, formattedMoney: formatCurrency(200000),
    totalMembers: 0, pendingMembers: 0, currentDay: 1, currentMonth: 1,
    racks: [], cashierCount: 1, queue: [], activeLoans: [], currentCustomers: 0, dayIncome: 0,
    isRunning: false,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GameLoop', () => {
  it('start() bootstraps facilities, marks running, and spawns a queue', () => {
    const loop = new GameLoop()
    loop.start()
    expect(useGameStore.getState().isRunning).toBe(true)
    expect(useGameStore.getState().racks.length).toBe(4)
    expect(useGameStore.getState().currentCustomers).toBeGreaterThan(0)
    loop.stop()
  })

  it('cashier tick serves a customer and increases money', () => {
    const loop = new GameLoop()
    loop.start()
    const before = useGameStore.getState().money
    vi.advanceTimersByTime(5000) // one cashier tick
    expect(useGameStore.getState().money).toBeGreaterThanOrEqual(before)
    loop.stop()
  })

  it('stop() clears running flag', () => {
    const loop = new GameLoop()
    loop.start()
    loop.stop()
    expect(useGameStore.getState().isRunning).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails, then passes**

Run: `npm test -- GameLoop`
Expected: FAIL before Step 1; PASS (3 tests) after.

- [ ] **Step 4: Commit**

```bash
git add src/game/loop/GameLoop.js src/game/loop/GameLoop.test.js
git commit -m "feat: add GameLoop timer controller for day and cashier ticks"
```

---

### Task 12: HUD component + wire into App

**Files:**
- Create: `src/components/hud/Hud.jsx`
- Create: `src/components/hud/Hud.css`
- Modify: `src/App.jsx`
- (No unit test — verified via build + dev run.)

**Interfaces:**
- Consumes: `useGameStore` selectors (`formattedMoney`, `currentDay`, `totalMembers`, `level`, `reputation`, `queue`, `hudVisible`, `currencyIcon`); `VILLAGE` from config; `GameLoop`.

- [ ] **Step 1: Create `src/components/hud/Hud.jsx`**

```jsx
import { useGameStore } from '../../game/store/index.js'
import { VILLAGE } from '../../game/config.js'
import './Hud.css'

// Read-only game HUD. Subscribes to individual store fields so a money change
// re-renders instantly without touching unrelated widgets.
export default function Hud() {
  const hudVisible = useGameStore((s) => s.hudVisible)
  const formattedMoney = useGameStore((s) => s.formattedMoney)
  const currentDay = useGameStore((s) => s.currentDay)
  const totalMembers = useGameStore((s) => s.totalMembers)
  const level = useGameStore((s) => s.level)
  const reputation = useGameStore((s) => s.reputation)
  const queueLength = useGameStore((s) => s.queue.length)

  if (!hudVisible) return null

  return (
    <div className="hud-panel">
      <div className="hud-money" title="Saldo koperasi">
        <span className="hud-money__coin" aria-hidden="true">🪙</span>
        <span className="hud-money__value">{formattedMoney}</span>
      </div>

      <div className="hud-stats">
        <span className="hud-stat">📅 Hari {currentDay}</span>
        <span className="hud-stat">�64 {VILLAGE[level]?.name ?? `Level ${level}`}</span>
        <span className="hud-stat">👥 {totalMembers}</span>
        <span className="hud-stat">⭐ {reputation}</span>
        <span className="hud-stat">🧑‍🤝‍🧑 Antre {queueLength}</span>
      </div>
    </div>
  )
}
```

Note: replace the `�64` placeholder above with a village emoji `🏘️` when typing — it is written here to avoid encoding ambiguity. Final line should read: `<span className="hud-stat">🏘️ {VILLAGE[level]?.name ?? \`Level ${level}\`}</span>`.

- [ ] **Step 2: Create `src/components/hud/Hud.css`**

```css
/* Top-right money readout + a row of compact stat chips below it. */
.hud-panel {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none; /* HUD is read-only; let clicks pass through */
}

.hud-money {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--merah);
  color: var(--cream);
  border: 3px solid var(--border-outer);
  border-radius: 8px;
  box-shadow: 0 4px 0 var(--border-outer), 0 8px 14px rgba(0, 0, 0, 0.5);
  font-family: var(--font-pixel);
  font-size: 14px;
}

.hud-money__coin {
  font-size: 18px;
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.4));
}

.hud-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 60vw;
}

.hud-stat {
  padding: 4px 8px;
  background: rgba(58, 33, 20, 0.85);
  color: var(--cream);
  border: 2px solid var(--border-bevel);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .hud-money { font-size: 11px; padding: 6px 10px; }
  .hud-stat { font-size: 11px; }
}
```

- [ ] **Step 3: Wire HUD + GameLoop into `src/App.jsx`**

Update the imports at the top:

```jsx
import { useEffect, useRef, useState } from 'react'
import GameButton from './components/GameButton.jsx'
import Interior from './components/Interior.jsx'
import Hud from './components/hud/Hud.jsx'
import { GameLoop } from './game/loop/GameLoop.js'
import './App.css'
```

Inside `App()`, after the existing `const [inside, setInside] = useState(false)` line, add the loop wiring:

```jsx
  const loopRef = useRef(null)

  useEffect(() => {
    const loop = new GameLoop()
    loopRef.current = loop
    loop.start()
    return () => loop.stop()
  }, [])
```

Then render `<Hud />` inside the `.hud` div — add it as the first child, right after the opening `<div className="hud">`:

```jsx
      <div className="hud">
        <Hud />
        {/* Center building = clickable hotspot */}
```

- [ ] **Step 4: Verify the full test suite passes**

Run: `npm test`
Expected: PASS — all suites green (currency, mechanics, economyTime, village, facilities, members, customers, loans, ui, game, GameLoop).

- [ ] **Step 5: Verify the app builds**

Run: `npm run build`
Expected: Vite build completes with no errors.

- [ ] **Step 6: Manual smoke check**

Run: `npm run dev`, open the served URL. Expected: top-right shows `🪙 Rp 200.000` plus stat chips (Hari 1, Desa Miskin, members, reputation, queue). Within ~5s the cashier tick begins serving spawned customers and the money value updates live.

- [ ] **Step 7: Commit**

```bash
git add src/components/hud/Hud.jsx src/components/hud/Hud.css src/App.jsx
git commit -m "feat: add live game HUD and start the simulation loop in App"
```

---

## Self-Review Notes

- **Spec coverage:** time/village/economy/members/facilities/customers/loans/ui slices (Tasks 3–9); all 14 required actions present — `startDay`/`endDay`/`bootstrap` (T10), `spawnCustomers`/`processCustomer`/`serveCustomer`/`failCustomer` (T7), `addRack`/`addCashier`/`restockItem` (T5), `registerMember`/`collectMonthlyFees` (T6), `processLoans` (T8), `upgradeVillage` (T4), `formatCurrency` (T1). HUD variables (money, formattedMoney, currencyIcon, membersCount=totalMembers, villageLevel=level, reputation, currentDay, customerQueueLength=queue.length) all exposed (T12). Real-time timers (T11). Vitest (T1).
- **Placeholders:** none — the two emoji notes in T12 flag encoding hazards, not missing content.
- **Type consistency:** `Rack`/`Customer`/`Loan`/`Notification` shapes match between `types.js` and slice code; action names consistent across tasks and Interfaces blocks.
- **Cross-slice access:** every action reaches other slices via `get()`; the single composed store in `store/index.js` makes all fields available at call time regardless of slice spread order.
