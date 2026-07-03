import { CUSTOMER_DEMAND_WEIGHTS, DIFFICULTIES, HAPPINESS, LOANS, MEMBERSHIP, SECTORS, VILLAGE } from './config.js'
import { ESSENTIAL_PRODUCT_IDS, PRODUCTS, PRODUCT_IDS } from './products.js'

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function productCapacity(productId, level) {
  return Math.round(PRODUCTS[productId].baseCapacity * VILLAGE[level].capacityModifier)
}

export function safeStockLevel(productId, level) {
  return Math.ceil(productCapacity(productId, level) * PRODUCTS[productId].safeStockRatio)
}

export function stockStatus(productId, stock, level) {
  if (stock <= 0) return 'critical'
  if (stock < safeStockLevel(productId, level)) return 'warning'
  return 'safe'
}

export function computeLocalSupplierPrice(productId, sectorLevel) {
  const discount = Math.min(SECTORS.maxDiscount, sectorLevel * SECTORS.discountPerLevel)
  return Math.round(PRODUCTS[productId].companyBuyPrice * (1 - discount))
}

export function computeSellPrice(productId, sectorLevel) {
  if (productId !== 'gas') return PRODUCTS[productId].baseSellPrice
  return PRODUCTS[productId].baseSellPrice + sectorLevel * SECTORS.gasMarginPerLevel
}

export function computeHappinessDelta(stockByProduct, level, difficultyId = 'normal') {
  const difficulty = DIFFICULTIES[difficultyId] ?? DIFFICULTIES.normal
  let delta = 0
  let allSafe = true
  PRODUCT_IDS.forEach((id) => {
    const status = stockStatus(id, stockByProduct[id] ?? 0, level)
    if (status === 'critical') {
      delta += HAPPINESS.emptyPenalty[id]
      allSafe = false
    } else if (status === 'warning') {
      delta += HAPPINESS.belowSafePenalty[id]
      allSafe = false
    }
  })
  if (allSafe) delta += HAPPINESS.allSafeBonus
  if (delta < 0) return Math.round(delta * difficulty.happinessLossMultiplier)
  return delta
}

export function computeDailyCustomerCount(level, happiness, rng = Math.random) {
  const [min, max] = VILLAGE[level].customerRange
  const base = Math.floor(rng() * (max - min + 1)) + min
  const modifier = 0.6 + (happiness / 100) * 0.8
  return Math.max(0, Math.round(base * modifier))
}

export function chooseDemand(rng = Math.random) {
  const roll = rng()
  let cursor = 0
  for (const id of PRODUCT_IDS) {
    cursor += CUSTOMER_DEMAND_WEIGHTS[id]
    if (roll <= cursor) return id
  }
  return PRODUCT_IDS[PRODUCT_IDS.length - 1]
}

export function computeMembershipChance({ happiness, allGoodsSafe, anyEssentialEmpty }) {
  let chance = MEMBERSHIP.base
  if (happiness >= 75) chance += MEMBERSHIP.highHappinessBonus
  if (allGoodsSafe) chance += MEMBERSHIP.allSafeBonus
  if (anyEssentialEmpty) chance -= MEMBERSHIP.essentialEmptyPenalty
  return clamp(chance, 0, MEMBERSHIP.max)
}

export function anyEssentialEmpty(stockByProduct) {
  return ESSENTIAL_PRODUCT_IDS.some((id) => (stockByProduct[id] ?? 0) <= 0)
}

export function allGoodsSafe(stockByProduct, level) {
  return PRODUCT_IDS.every((id) => stockStatus(id, stockByProduct[id] ?? 0, level) === 'safe')
}

export function computeLoanRisk(applicant, difficultyId = 'normal') {
  const difficulty = DIFFICULTIES[difficultyId] ?? DIFFICULTIES.normal
  const debtBurdenRatio = applicant.loanAmount / Math.max(1, applicant.monthlyIncome)
  let debtBurdenScore = 45
  if (debtBurdenRatio <= 1.5) debtBurdenScore = 0
  else if (debtBurdenRatio <= 3) debtBurdenScore = 15
  else if (debtBurdenRatio <= 5) debtBurdenScore = 30

  const crimeScore = { none: 0, minor: 15, serious: 35 }[applicant.crimeHistory] ?? 0
  const repaymentScore = { good: -10, average: 5, none: 10, bad: 30 }[applicant.repaymentHistory] ?? 10
  const jobMismatchScore = { match: 0, related: 10, unrelated: 25 }[applicant.jobSectorFit] ?? 25
  const incomeStability = applicant.incomeStability === 'stable' ? -10 : 0
  const impactBonus = { high: -10, medium: -5, low: 0 }[applicant.potentialVillageImpact] ?? 0

  return clamp(20 + debtBurdenScore + crimeScore + repaymentScore + jobMismatchScore + incomeStability + impactBonus + difficulty.loanRiskOffset, 0, 100)
}

export function riskLabel(riskScore) {
  if (riskScore <= LOANS.riskLabels.lowMax) return 'Low Risk'
  if (riskScore <= LOANS.riskLabels.mediumMax) return 'Medium Risk'
  return 'High Risk'
}

export function loanSuccessChance(loan) {
  const impactBonus = loan.potentialVillageImpact === 'high' ? 0.05 : 0
  return clamp(0.9 - loan.riskScore / 120 + impactBonus, 0.15, 0.95)
}
