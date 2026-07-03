import { useGameStore } from '../../game/store/index.js'
import { VILLAGE } from '../../game/config.js'
import { PRODUCTS, PRODUCT_IDS } from '../../game/products.js'
import { formatCurrency } from '../../game/currency.js'
import { safeStockLevel, stockStatus } from '../../game/mechanics.js'
import './Hud.css'

function statusLabel(status) {
  if (status === 'critical') return 'Critical'
  if (status === 'warning') return 'Warning'
  return 'Safe'
}

export default function Hud() {
  const hudVisible = useGameStore((s) => s.hudVisible)
  const formattedMoney = useGameStore((s) => s.formattedMoney)
  const currentDay = useGameStore((s) => s.currentDay)
  const totalMembers = useGameStore((s) => s.totalMembers)
  const pendingMembers = useGameStore((s) => s.pendingMembers)
  const level = useGameStore((s) => s.level)
  const happiness = useGameStore((s) => s.happiness)
  const queueLength = useGameStore((s) => s.queue.length)
  const racks = useGameStore((s) => s.racks)
  const sectors = useGameStore((s) => s.sectors)
  const activeLoanRequests = useGameStore((s) => s.activeLoanRequests)
  const acceptedLoans = useGameStore((s) => s.acceptedLoans)
  const notifications = useGameStore((s) => s.notifications)
  const gameStatus = useGameStore((s) => s.gameStatus)
  const lossReason = useGameStore((s) => s.lossReason)
  const restockItem = useGameStore((s) => s.restockItem)
  const acceptLoan = useGameStore((s) => s.acceptLoan)
  const rejectLoan = useGameStore((s) => s.rejectLoan)
  const localSupplierPrice = useGameStore((s) => s.localSupplierPrice)

  if (!hudVisible) return null

  const stockOf = (itemType) =>
    racks.filter((r) => r.itemType === itemType).reduce((sum, r) => sum + r.currentStock, 0)
  const capacityOf = (itemType) =>
    racks.filter((r) => r.itemType === itemType).reduce((sum, r) => sum + r.capacity, 0)

  return (
    <div className="hud-panel">
      <section className="hud-summary" aria-label="Cooperative status">
        <div className="hud-money" title="Saldo koperasi">
          <span className="hud-money__coin" aria-hidden="true">🪙</span>
          <span className="hud-money__value">{formattedMoney}</span>
        </div>

        <div className="hud-stats">
          <span className="hud-stat">📅 Day {currentDay}/90</span>
          <span className="hud-stat">🏘️ {VILLAGE[level]?.name ?? `Level ${level}`}</span>
          <span className="hud-stat">😊 {happiness}%</span>
          <span className="hud-stat" title={pendingMembers > 0 ? `${pendingMembers} pending members` : 'Members'}>
            👥 {totalMembers}
            {pendingMembers > 0 && <span className="hud-stat__pending">+{pendingMembers}</span>}
          </span>
          <span className="hud-stat">Queue {queueLength}</span>
          <span className={`hud-stat hud-stat--${gameStatus}`}>{gameStatus}</span>
        </div>
        {lossReason && <div className="hud-alert">{lossReason}</div>}
      </section>

      <section className="hud-grid" aria-label="Kopdes management">
        <div className="hud-card">
          <h2>Stock & Suppliers</h2>
          <div className="stock-list">
            {PRODUCT_IDS.map((id) => {
              const product = PRODUCTS[id]
              const stock = stockOf(id)
              const capacity = capacityOf(id)
              const status = stockStatus(id, stock, level)
              const safe = safeStockLevel(id, level)
              return (
                <article key={id} className={`stock-row stock-row--${status}`}>
                  <div className="stock-row__head">
                    <strong>{product.label}</strong>
                    <span>{statusLabel(status)}</span>
                  </div>
                  <div className="stock-meter" aria-label={`${product.label} stock ${stock} of ${capacity}`}>
                    <span style={{ width: `${capacity > 0 ? Math.min(100, (stock / capacity) * 100) : 0}%` }} />
                  </div>
                  <div className="stock-row__meta">
                    <span>{stock}/{capacity}</span>
                    <span>Safe {safe}</span>
                  </div>
                  <div className="supplier-prices">
                    <span>Company {formatCurrency(product.companyBuyPrice)}</span>
                    <span>Local {formatCurrency(localSupplierPrice(id))}</span>
                  </div>
                  <div className="hud-actions">
                    <button type="button" onClick={() => restockItem(id, 10, 'company')}>Company +10</button>
                    <button type="button" onClick={() => restockItem(id, 10, 'local')}>Local +10</button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="hud-card">
          <h2>Sectors</h2>
          <div className="sector-list">
            {PRODUCT_IDS.map((id) => (
              <div key={id} className="sector-row">
                <span>{PRODUCTS[id].label}</span>
                <strong>Lv {sectors[id]?.level ?? 0}/5</strong>
              </div>
            ))}
          </div>

          <h2>Loan Requests</h2>
          <div className="loan-list">
            {activeLoanRequests.length === 0 && <p className="hud-empty">No pending requests.</p>}
            {activeLoanRequests.slice(0, 3).map((loan) => (
              <article key={loan.id} className={`loan-card loan-card--${loan.riskLabel.split(' ')[0].toLowerCase()}`}>
                <div className="loan-card__head">
                  <strong>{loan.applicant}</strong>
                  <span>{loan.riskLabel}</span>
                </div>
                <p>{loan.job} asks {formatCurrency(loan.loanAmount)} for {loan.sectorType}.</p>
                <p>Income {formatCurrency(loan.monthlyIncome)} · {loan.repaymentHistory} repayment · {loan.crimeHistory} crime history</p>
                <p>Impact: {loan.potentialVillageImpact}</p>
                <div className="hud-actions">
                  <button type="button" onClick={() => acceptLoan(loan.id)}>Accept</button>
                  <button type="button" onClick={() => rejectLoan(loan.id)}>Reject</button>
                </div>
              </article>
            ))}
          </div>

          {acceptedLoans.length > 0 && <p className="hud-empty">{acceptedLoans.length} accepted loan(s) resolving soon.</p>}
        </div>

        <div className="hud-card hud-card--log">
          <h2>Daily Log</h2>
          <div className="event-log">
            {notifications.slice(0, 7).map((note) => (
              <p key={note.id} className={`event-log__item event-log__item--${note.type}`}>
                Day {note.day}: {note.message}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
