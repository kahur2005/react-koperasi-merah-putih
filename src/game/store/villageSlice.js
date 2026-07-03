import { HAPPINESS, UPGRADE_REQUIREMENTS, VILLAGE } from '../config.js'
import { clamp } from '../mechanics.js'

export const createVillageSlice = (set, get) => ({
  level: 1,
  happiness: HAPPINESS.start,

  adjustHappiness: (delta) =>
    set((s) => ({
      happiness: clamp(s.happiness + delta, HAPPINESS.min, HAPPINESS.max),
    })),

  upgradeVillage: () => {
    const { level, totalMembers = 0 } = get()
    const nextLevel = level + 1
    const req = UPGRADE_REQUIREMENTS[nextLevel]
    if (!req) return false
    if (totalMembers >= req.members) {
      set({ level: nextLevel })
      get().pushNotification?.('upgrade', `Koperasi naik ke ${VILLAGE[nextLevel].name}.`)
      return true
    }
    return false
  },
})
