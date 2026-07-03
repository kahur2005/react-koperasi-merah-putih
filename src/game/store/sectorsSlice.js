import { SECTORS } from '../config.js'
import { PRODUCT_IDS } from '../products.js'
import { computeLocalSupplierPrice, computeSellPrice } from '../mechanics.js'

const initialSectors = () =>
  PRODUCT_IDS.reduce((acc, id) => {
    acc[id] = { id, level: 0, maxLevel: SECTORS.maxLevel, successfulLoans: 0, failedLoans: 0 }
    return acc
  }, {})

export const createSectorsSlice = (set, get) => ({
  sectors: initialSectors(),

  resetSectors: () => set({ sectors: initialSectors() }),

  sectorLevel: (sectorType) => get().sectors[sectorType]?.level ?? 0,

  localSupplierPrice: (productId) => computeLocalSupplierPrice(productId, get().sectorLevel(productId)),

  sellingPrice: (productId) => computeSellPrice(productId, get().sectorLevel(productId)),

  improveSector: (sectorType) =>
    set((s) => ({
      sectors: {
        ...s.sectors,
        [sectorType]: {
          ...s.sectors[sectorType],
          level: Math.min(SECTORS.maxLevel, s.sectors[sectorType].level + 1),
          successfulLoans: s.sectors[sectorType].successfulLoans + 1,
        },
      },
    })),

  recordSectorFailure: (sectorType) =>
    set((s) => ({
      sectors: {
        ...s.sectors,
        [sectorType]: {
          ...s.sectors[sectorType],
          failedLoans: s.sectors[sectorType].failedLoans + 1,
        },
      },
    })),
})
