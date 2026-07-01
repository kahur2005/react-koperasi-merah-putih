/**
 * @typedef {Object} Rack
 * @property {string} id
 * @property {string} itemType   Product id (e.g. 'rice').
 * @property {number} capacity   Fixed at RACK_CAPACITY (20).
 * @property {number} currentStock
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} requestedItem  Product id the customer wants.
 */

/**
 * @typedef {Object} Loan
 * @property {string} id
 * @property {number} memberId
 * @property {number} amount
 * @property {number} dueDay
 * @property {number} interestRate
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} message
 * @property {number} day
 */

export {}
