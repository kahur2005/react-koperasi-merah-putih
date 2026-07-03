/**
 * @typedef {Object} Rack
 * @property {string} id
 * @property {'rice'|'fruit'|'gas'} itemType
 * @property {number} capacity
 * @property {number} currentStock
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {'rice'|'fruit'|'gas'} requestedItem
 */

/**
 * @typedef {Object} Sector
 * @property {'rice'|'fruit'|'gas'} id
 * @property {number} level
 * @property {number} maxLevel
 * @property {number} successfulLoans
 * @property {number} failedLoans
 */

/**
 * @typedef {Object} LoanRequest
 * @property {string} id
 * @property {string} applicant
 * @property {number} age
 * @property {string} job
 * @property {number} monthlyIncome
 * @property {number} loanAmount
 * @property {string} purpose
 * @property {'rice'|'fruit'|'gas'} sectorType
 * @property {'none'|'minor'|'serious'} crimeHistory
 * @property {'good'|'average'|'bad'|'none'} repaymentHistory
 * @property {number} riskScore
 * @property {'Low Risk'|'Medium Risk'|'High Risk'} riskLabel
 * @property {'low'|'medium'|'high'} potentialVillageImpact
 * @property {'pending'|'accepted'|'rejected'|'succeeded'|'failed'} status
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} message
 * @property {number} day
 */

export {}
