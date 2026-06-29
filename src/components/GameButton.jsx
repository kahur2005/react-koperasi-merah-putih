import './GameButton.css'

/**
 * Stardew-style wooden signboard button.
 *
 * @param {string} label   Short text shown on the plank.
 * @param {string} icon    Optional emoji/glyph shown above the label.
 * @param {string} corner  Anchor position: top-left | top-right | mid-left | bottom-left | bottom-right.
 * @param {() => void} onClick
 */
export default function GameButton({ label, icon, corner, onClick }) {
  return (
    <button
      type="button"
      className={`game-button game-button--${corner}`}
      onClick={onClick}
    >
      <span className="game-button__plank">
        {icon && <span className="game-button__icon">{icon}</span>}
        <span className="game-button__label">{label}</span>
      </span>
    </button>
  )
}
