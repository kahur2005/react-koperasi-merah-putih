import { useEffect, useRef, useState } from 'react'
import GameButton from './components/GameButton.jsx'
import Interior from './components/Interior.jsx'
import Hud from './components/hud/Hud.jsx'
import { GameLoop } from './game/loop/GameLoop.js'
import './App.css'

/* Placeholder actions — swap these out for real navigation later. */
const buttons = [
  { corner: 'top-left', icon: '🎒', label: 'Inventory' },
  { corner: 'top-right', icon: '⚙️', label: 'Settings' },
  { corner: 'mid-left', icon: '🗺️', label: 'Map' },
  { corner: 'bottom-left', icon: '👥', label: 'Members' },
  { corner: 'bottom-right', icon: '🪙', label: 'Shop' },
]

export default function App() {
  const [inside, setInside] = useState(false)
  const loopRef = useRef(null)

  useEffect(() => {
    const loop = new GameLoop()
    loopRef.current = loop
    loop.store.getState().loadGame()
    loop.start()
    return () => loop.stop()
  }, [])

  const handleButton = (label) => {
    // Placeholder — wire up real screens here.
    console.log(`[button] ${label}`)
  }

  const handleEnter = () => setInside(true)

  if (inside) {
    return <Interior onExit={() => setInside(false)} />
  }

  return (
    <main className="stage">
      {/* Full-screen pixel-art background (purely the backdrop). */}
      <div className="stage__bg" aria-hidden="true" />

      {/* Game HUD overlaid on top of the background. */}
      <div className="hud">
        <Hud />
        {/* Center building = clickable hotspot */}
        <button
          type="button"
          className="building-hotspot"
          onClick={handleEnter}
          aria-label="Enter Koperasi Merah Putih"
        >
          <span className="building-hotspot__tip">Enter ▸</span>
        </button>

        {buttons.map((b) => (
          <GameButton
            key={b.corner}
            corner={b.corner}
            icon={b.icon}
            label={b.label}
            onClick={() => handleButton(b.label)}
          />
        ))}
      </div>
    </main>
  )
}
