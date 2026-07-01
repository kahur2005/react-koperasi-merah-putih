import { CASHIER_INTERVAL_MS, DAY_DURATION_MS } from '../config.js'
import { useGameStore } from '../store/index.js'

/**
 * Owns the real-time timers that drive the simulation. Keeps timers OUT of
 * React and the store so simulation logic stays pure/testable.
 */
export class GameLoop {
  constructor(store = useGameStore) {
    this.store = store
    this.dayTimer = null
    this.cashierTimer = null
  }

  start() {
    const s = this.store.getState()
    if (s.isRunning) return
    s.setRunning(true)
    s.bootstrap()
    s.startDay()
    this.cashierTimer = setInterval(() => this.tickCashiers(), CASHIER_INTERVAL_MS)
    this.dayTimer = setInterval(() => this.tickDay(), DAY_DURATION_MS)
  }

  tickCashiers() {
    const s = this.store.getState()
    for (let i = 0; i < s.cashierCount; i++) s.serveCustomer()
  }

  tickDay() {
    this.store.getState().endDay()
    if (this.store.getState().isGameOver()) {
      this.stop()
      return
    }
    this.store.getState().startDay()
  }

  stop() {
    clearInterval(this.dayTimer)
    clearInterval(this.cashierTimer)
    this.dayTimer = null
    this.cashierTimer = null
    this.store.getState().setRunning(false)
  }
}
