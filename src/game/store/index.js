import { create } from 'zustand'
import { createTimeSlice } from './timeSlice.js'
import { createEconomySlice } from './economySlice.js'

export const useGameStore = create((set, get) => ({
  ...createTimeSlice(set, get),
  ...createEconomySlice(set, get),
}))
