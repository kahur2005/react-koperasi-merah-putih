import { GAME_DAYS, GAME_STATUS, MONTHLY_INTERVAL_DAYS } from '../config.js'

export const createTimeSlice = (set, get) => ({
  currentDay: 1,
  currentMonth: 1,
  gameTime: 0, // ms elapsed within the current day
  isRunning: false,

  setRunning: (running) => set({ isRunning: running }),
  setGameTime: (ms) => set({ gameTime: ms }),

  advanceDay: () =>
    set((s) => {
      const nextDay = s.currentDay + 1
      return {
        currentDay: nextDay,
        currentMonth: Math.floor((nextDay - 1) / MONTHLY_INTERVAL_DAYS) + 1,
        gameTime: 0,
      }
    }),

  isGameOver: () => get().currentDay > GAME_DAYS || get().gameStatus !== GAME_STATUS.running,
})
