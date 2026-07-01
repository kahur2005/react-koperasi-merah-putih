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
