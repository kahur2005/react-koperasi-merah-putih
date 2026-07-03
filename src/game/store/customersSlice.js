import { ESSENTIAL_PRODUCT_IDS, PRODUCTS } from '../products.js'
import {
  allGoodsSafe,
  anyEssentialEmpty,
  chooseDemand,
  computeDailyCustomerCount,
  computeMembershipChance,
} from '../mechanics.js'

let customerCounter = 0

export const createCustomersSlice = (set, get) => ({
  currentCustomers: 0,
  queue: [],
  dayIncome: 0,
  disappointedCustomers: 0,

  requiredStockEmpty: () => ESSENTIAL_PRODUCT_IDS.some((id) => get().stockOf(id) <= 0),

  spawnCustomers: (rng = Math.random) => {
    const count = computeDailyCustomerCount(get().level, get().happiness, rng)
    set({ currentCustomers: count })
    for (let i = 0; i < count; i++) {
      const customer = {
        id: `cust-${++customerCounter}`,
        requestedItem: chooseDemand(rng),
      }
      get().processCustomer(customer)
    }
    return count
  },

  processCustomer: (customer) => {
    if (get().stockOf(customer.requestedItem) > 0) {
      set((s) => ({ queue: [...s.queue, customer] }))
    } else {
      get().failCustomer(customer)
    }
  },

  serveCustomer: (rng = Math.random) => {
    const { queue } = get()
    if (queue.length === 0) return null
    const [customer, ...rest] = queue
    if (!get().consumeStock(customer.requestedItem, 1)) {
      set({ queue: rest })
      get().failCustomer(customer)
      return null
    }
    const price = get().sellingPrice(customer.requestedItem)
    get().addMoney(price)
    set((s) => ({ queue: rest, dayIncome: s.dayIncome + price }))

    const stockByProduct = get().stockByProduct()
    const chance = computeMembershipChance({
      happiness: get().happiness,
      allGoodsSafe: allGoodsSafe(stockByProduct, get().level),
      anyEssentialEmpty: anyEssentialEmpty(stockByProduct),
    })
    if (rng() < chance) get().registerMember()
    return customer
  },

  failCustomer: (customer) => {
    set((s) => ({ disappointedCustomers: s.disappointedCustomers + 1 }))
    get().pushNotification?.('warning', `${PRODUCTS[customer.requestedItem].label} unavailable. Customer disappointed.`)
  },

  resetDayCustomers: () => set({ currentCustomers: 0, queue: [], dayIncome: 0, disappointedCustomers: 0 }),
})
