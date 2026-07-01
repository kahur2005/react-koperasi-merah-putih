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
