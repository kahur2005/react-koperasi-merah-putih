import { FACILITY_COSTS, VILLAGE } from '../config.js'
import { PRODUCTS, PRODUCT_IDS } from '../products.js'
import { productCapacity } from '../mechanics.js'

let rackCounter = 0

export const createFacilitiesSlice = (set, get) => ({
  racks: [],
  cashierCount: 1,
  placeableCount: 0,

  addRack: (itemType, { free = false } = {}) => {
    const { racks, level } = get()
    if (racks.length >= VILLAGE[level].maxRacks) return false
    if (!free && !get().spendMoney(FACILITY_COSTS.rack)) return false
    const rack = {
      id: `rack-${++rackCounter}`,
      itemType,
      capacity: productCapacity(itemType, level),
      currentStock: 0,
    }
    set({ racks: [...racks, rack] })
    return true
  },

  addCashier: () => {
    const { cashierCount, level } = get()
    if (cashierCount >= VILLAGE[level].maxCashiers) return false
    if (!get().spendMoney(FACILITY_COSTS.cashier)) return false
    set({ cashierCount: cashierCount + 1 })
    return true
  },

  addPlaceable: () => {
    const { placeableCount, level } = get()
    if (placeableCount >= VILLAGE[level].maxPlaceables) return false
    if (!get().spendMoney(FACILITY_COSTS.placeable)) return false
    set({ placeableCount: placeableCount + 1 })
    return true
  },

  refreshRackCapacities: () =>
    set((s) => ({
      racks: s.racks.map((r) => {
        const capacity = productCapacity(r.itemType, s.level)
        return { ...r, capacity, currentStock: Math.min(r.currentStock, capacity) }
      }),
    })),

  restockItem: (itemType, amount, supplier = 'company') => {
    const price = supplier === 'local' ? get().localSupplierPrice(itemType) : PRODUCTS[itemType].companyBuyPrice
    const cost = price * amount
    if (!get().spendMoney(cost)) return false
    let remaining = amount
    set((s) => ({
      racks: s.racks.map((r) => {
        if (r.itemType !== itemType || remaining <= 0) return r
        const room = r.capacity - r.currentStock
        const add = Math.min(room, remaining)
        remaining -= add
        return { ...r, currentStock: r.currentStock + add }
      }),
    }))
    const stocked = amount - remaining
    if (remaining > 0) get().addMoney(price * remaining)
    if (stocked > 0) get().pushNotification?.('stock', `Restocked ${stocked} ${PRODUCTS[itemType].label} from ${supplier}.`)
    return stocked > 0
  },

  stockOf: (itemType) =>
    get()
      .racks.filter((r) => r.itemType === itemType)
      .reduce((sum, r) => sum + r.currentStock, 0),

  stockByProduct: () =>
    PRODUCT_IDS.reduce((acc, id) => {
      acc[id] = get().stockOf(id)
      return acc
    }, {}),

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
