import { useGameStore } from '../../game/store/index.js'
import { VILLAGE } from '../../game/config.js'
import './Hud.css'

// Read-only game HUD. Subscribes to individual store fields so a money change
// re-renders instantly without touching unrelated widgets.
export default function Hud() {
  const hudVisible = useGameStore((s) => s.hudVisible)
  const formattedMoney = useGameStore((s) => s.formattedMoney)
  const currentDay = useGameStore((s) => s.currentDay)
  const totalMembers = useGameStore((s) => s.totalMembers)
  const level = useGameStore((s) => s.level)
  const reputation = useGameStore((s) => s.reputation)
  const queueLength = useGameStore((s) => s.queue.length)

  if (!hudVisible) return null

  return (
    <div className="hud-panel">
      <div className="hud-money" title="Saldo koperasi">
        <span className="hud-money__coin" aria-hidden="true">🪙</span>
        <span className="hud-money__value">{formattedMoney}</span>
      </div>

      <div className="hud-stats">
        <span className="hud-stat">📅 Hari {currentDay}</span>
        <span className="hud-stat">🏘️ {VILLAGE[level]?.name ?? `Level ${level}`}</span>
        <span className="hud-stat">👥 {totalMembers}</span>
        <span className="hud-stat">⭐ {reputation}</span>
        <span className="hud-stat">🧑‍🤝‍🧑 Antre {queueLength}</span>
      </div>
    </div>
  )
}
