import { create } from 'zustand'
import { createTimeSlice } from './timeSlice.js'
import { createEconomySlice } from './economySlice.js'
import { createVillageSlice } from './villageSlice.js'
import { createFacilitiesSlice } from './facilitiesSlice.js'
import { createMembersSlice } from './membersSlice.js'
import { createCustomersSlice } from './customersSlice.js'
import { createLoansSlice } from './loansSlice.js'
import { createUiSlice } from './uiSlice.js'
import { createGameSlice } from './gameSlice.js'

export const useGameStore = create((set, get) => ({
  ...createTimeSlice(set, get),
  ...createEconomySlice(set, get),
  ...createVillageSlice(set, get),
  ...createFacilitiesSlice(set, get),
  ...createMembersSlice(set, get),
  ...createCustomersSlice(set, get),
  ...createLoansSlice(set, get),
  ...createUiSlice(set, get),
  ...createGameSlice(set, get),
}))
