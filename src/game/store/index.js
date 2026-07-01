import { create } from 'zustand'
import { createTimeSlice } from './timeSlice.js'
import { createEconomySlice } from './economySlice.js'
import { createVillageSlice } from './villageSlice.js'
import { createFacilitiesSlice } from './facilitiesSlice.js'

export const useGameStore = create((set, get) => ({
  ...createTimeSlice(set, get),
  ...createEconomySlice(set, get),
  ...createVillageSlice(set, get),
  ...createFacilitiesSlice(set, get),
}))
