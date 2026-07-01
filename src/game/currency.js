/**
 * Format a number as Indonesian Rupiah, e.g. 200000 -> "Rp 200.000".
 * Uses a manual grouping regex (no ICU dependency) for deterministic output.
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '-' : ''
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}Rp ${digits}`
}
