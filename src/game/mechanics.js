import { MEMBERSHIP, REPUTATION } from './config.js'

/**
 * Membership conversion chance for one successful transaction.
 * Rice OR gas empty forces 0 (dominant rule); otherwise base + bonuses.
 * @param {{fullStock:boolean, fastQueue:boolean, gasEmpty:boolean, riceEmpty:boolean}} ctx
 * @returns {number} chance in [0, 1]
 */
export function computeMembershipChance({ fullStock, fastQueue, gasEmpty, riceEmpty }) {
  if (gasEmpty || riceEmpty) return 0
  let chance = MEMBERSHIP.base
  if (fullStock) chance += MEMBERSHIP.fullStockBonus
  if (fastQueue) chance += MEMBERSHIP.fastQueueBonus
  return Math.max(0, Math.min(1, chance))
}

/**
 * Number of customers to spawn for a reputation band.
 * @param {'low'|'mid'|'high'} band
 * @param {() => number} [rng]
 * @returns {number}
 */
export function spawnCountForBand(band, rng = Math.random) {
  const b = REPUTATION.bands[band]
  return Math.floor(rng() * (b.spawnMax - b.min + 1)) + b.min
}
