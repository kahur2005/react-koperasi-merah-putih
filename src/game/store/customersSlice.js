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
      get().failCustomer(customer)
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
