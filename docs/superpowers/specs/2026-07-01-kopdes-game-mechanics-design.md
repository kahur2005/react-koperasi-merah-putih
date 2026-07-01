# Kopdes Merah Putih — Game Mechanics Design

**Date:** 2026-07-01
**Status:** Approved
**Scope:** Zustand-based simulation game system + live HUD for "Kopdes Merah Putih".

## 1. Goal

Simulate managing a rural cooperative (kopdes) over one in-game year (365 days).
Player starts with Rp200.000 and grows the cooperative through three village levels:

1. **Desa Miskin** (Level 1)
2. **Desa Menengah** (Level 2)
3. **Desa Maju** (Level 3)

Time scale: **1 in-game day = 5 real minutes (300s)**.

## 2. Confirmed Decisions

| Decision | Choice |
| --- | --- |
| Build scope | Zustand store + logic + **live HUD** wired into `App` |
| 3D integration | **Abstract for now** — facilities are pure game state; no bridge to the R3F `Interior` scene yet |
| Typing | **JSDoc `@typedef`** in plain JS/JSX (no TypeScript conversion) |
| Game clock | **Real-time timers** (`setInterval`): day auto-advances, cashiers tick |
| Tests | **Vitest** (Vite-native) for pure logic checks |

## 3. Architecture

One Zustand store composed of **modular slices**. Each slice owns its state plus the
actions that mutate it. A separate, non-React **game-loop controller** owns the timers
and calls store actions, keeping simulation logic pure and testable while timers live
outside React.

```
src/game/
  store/
    index.js           # create()-s store, composes slices, exposes useGameStore
    timeSlice.js       # currentDay, currentMonth, gameTime, isRunning
    villageSlice.js    # level, reputation (+ upgradeVillage, reputation math)
    economySlice.js    # money, formattedMoney (derived on every money change)
    membersSlice.js    # totalMembers (+ registerMember, collectMonthlyFees)
    facilitiesSlice.js # racks[], cashierCount (+ addRack, addCashier, restockItem)
    customersSlice.js  # currentCustomers, queue (+ spawn/process/serve/fail)
    loansSlice.js      # activeLoans (+ processLoans)
    uiSlice.js         # currencyIcon, hudVisible, notifications
  loop/
    GameLoop.js        # setInterval controller: day timer + cashier tick
  config.js            # all tunable constants (prices, chances, limits, durations)
  currency.js          # formatCurrency(n) -> "Rp 200.000"
  types.js             # JSDoc @typedef definitions
  products.js          # RICE / GAS / VEGGIES / UMKM product defs
src/components/hud/
  Hud.jsx + Hud.css    # top-right money+coin readout; day/members/reputation/queue
```

**Data flow:** `GameLoop` (timers) -> store actions -> state change -> React HUD
re-renders via `useGameStore` selectors. Money changes update `formattedMoney`
synchronously inside the economy slice, so the HUD updates the instant a transaction
lands.

## 4. State Shape

```
time:       { currentDay, currentMonth, gameTime, isRunning }
village:    { level, reputation }
economy:    { money, formattedMoney }
members:    { totalMembers, pendingMembers }
facilities: { racks: Rack[], cashierCount }
customers:  { currentCustomers, queue: Customer[] }
loans:      { activeLoans: Loan[] }
ui:         { currencyIcon, hudVisible, notifications: Notification[] }
```

Typedefs (JSDoc, in `types.js`):

- `Rack`   = `{ id, itemType, capacity: 20, currentStock }`
- `Customer` = `{ id, requestedItem, servedThisDay }`
- `Loan`   = `{ id, memberId, amount, dueDay, interestRate: 0.05 }`
- `Notification` = `{ id, type, message, day }`

## 5. Required Actions

`startDay()`, `endDay()`, `spawnCustomers()`, `processCustomer()`, `serveCustomer()`,
`failCustomer()`, `addRack(type)`, `addCashier()`, `restockItem(type, amount)`,
`registerMember()`, `collectMonthlyFees()`, `processLoans()`, `upgradeVillage()`,
`formatCurrency(n)`.

## 6. Core Game Loop (made concrete)

**On `startDay()`** (day timer starts, `DAY_DURATION_MS = 300000`):
1. Determine spawn count from reputation band:
   - Low -> 5–8, Mid -> 8–15, High -> 15–25+ (base spec range 7–15 sits in Mid).
   - If rice OR gas stock is 0 globally -> spawn count reduced.
2. `spawnCustomers()` creates that many `Customer`s; each requests a random product.
3. `processCustomer()` per customer: item available -> push to cashier `queue`;
   unavailable -> `failCustomer()` (customer leaves, reputation drops).

**Cashier tick every `CASHIER_INTERVAL_MS = 5000`:**
- Each of `cashierCount` cashiers pops one customer from `queue` -> `serveCustomer()`:
  - reduce stock, increase money by product price,
  - roll membership: base **40%** + modifiers
    (full stock **+10%**, fast queue **+5%**, gas empty **-40%**, rice empty **-50%**);
    if rice OR gas is empty, membership chance is forced to **0%**.
  - success -> `registerMember()` adds to `pendingMembers`.

**On `endDay()`** (at day duration):
1. Tally the day's income.
2. Apply `pendingMembers` -> `totalMembers`.
3. `upgradeVillage()` check:
   - L2 requires `money >= 200000` AND `members >= 20`.
   - L3 requires `money >= 500000` AND `members >= 50`.
4. Advance `currentDay` (and `currentMonth` every 30 days).
5. Every 30 days: `collectMonthlyFees()` then `processLoans()`.
6. Stop at day 365.

## 7. Economy

Initial money: **200000**. Products (in `products.js`):

| Product | Required | Notes |
| --- | --- | --- |
| Rice (Beras) | yes | empty -> spawn reduced, membership 0, reputation drops |
| Gas (LPG) | yes | empty -> spawn reduced, membership 0, reputation drops |
| Vegetables/Fruits | no | |
| UMKM products | no | |

Each product has a `price` and `isRequired` flag in config.

## 8. Membership & Loans

- Base membership chance 40% with modifiers above; monthly `money += members * 2000`.
- Loans (every 30 days): 5% of members borrow a random `5000–30000`; repay
  `amount * 1.05` after 30 days (`dueDay`). Tracked in `activeLoans`.

## 9. Facilities (fixed capacity — NO leveling)

- **Racks:** capacity fixed at **20**; only quantity grows.
  Village caps: L1 = 4, L2 = 6, L3 = 8 racks. `addRack` rejects past cap.
  Each rack: `{ id, itemType, capacity: 20, currentStock }`.
- **Cashiers:** each serves 1 customer / 5s; only quantity grows.
  Village caps: L1 = 1, L2 = 2, L3 = 3. `addCashier` rejects past cap.

## 10. Reputation

Affects customer spawn range (bands in section 6). Changes from: stock availability,
successful queue transactions (+), failed customers (-). Clamped to a fixed range in
config.

## 11. Config-Driven Balancing

`config.js` holds every tunable number: product prices, membership base + modifiers,
reputation bands + deltas, village upgrade thresholds, facility caps, `DAY_DURATION_MS`,
`CASHIER_INTERVAL_MS`. Shortening `DAY_DURATION_MS` lets us test without a code hunt.

## 12. UI / HUD

- Top-right corner: rupiah coin icon + `formattedMoney`, e.g. `[🪙 Rp 235.000]`.
- Additional readouts: `currentDay`, `membersCount`, `villageLevel`, `reputation`,
  `customerQueueLength`.
- Updates in real time via `useGameStore` selectors as transactions happen.

## 13. Testing (Vitest)

Pure-logic unit tests, no runner currently installed -> add Vitest as a dev dependency:

- `formatCurrency` -> `"Rp 200.000"` formatting.
- Membership-chance computation across modifier combinations (incl. forced-0 cases).
- Village upgrade gate (thresholds, both conditions required).
- `serveCustomer` (stock down, money up) and `failCustomer` (reputation down) effects.
- `addRack` / `addCashier` cap enforcement per village level.

## 14. Out of Scope (this pass)

- Bridging facilities to the 3D `Interior` scene (racks/cashiers stay abstract state).
- Persistence/save-load. Sound. Interactive dev control panel (may add later).
