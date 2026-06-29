import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Html, Text, useGLTF } from '@react-three/drei'
import { BackSide, Box3, FrontSide, Plane, Vector3 } from 'three'
import {
  ALL_MODEL_URLS,
  COLOR_HEX,
  ITEMS,
  ITEM_BY_TYPE,
  MAX_PER_ITEM,
  ROOM,
  defaultColor,
  modelUrl,
} from '../interior/items.js'
import './Interior.css'

let idSeq = 0

const HALF_W = ROOM.width / 2
const HALF_D = ROOM.depth / 2
const QUARTER = Math.PI / 2

// Reusable math plane (y = 0) used to project the pointer onto the floor.
const DRAG_PLANE = new Plane(new Vector3(0, 1, 0), 0)
const HIT = new Vector3()

// Warm the cache so models don't pop in when first placed.
ALL_MODEL_URLS.forEach((url) => useGLTF.preload(url))

/* Snap a world coordinate to the center of its 1x1 grid cell. */
const snapToCell = (v) => Math.floor(v) + 0.5

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* Footprint on the floor after rotation: odd quarter-turns swap width/depth. */
function footprint([w, , d], rot) {
  const odd = Math.abs(Math.round(rot / QUARTER)) % 2 === 1
  return odd ? [d, w] : [w, d]
}

/* Clamp a center so the (rotated) footprint stays inside the room. */
function clampPos([x, z], w, d) {
  return [clamp(x, -HALF_W + w / 2, HALF_W - w / 2), clamp(z, -HALF_D + d / 2, HALF_D - d / 2)]
}

/* Snap to cell center, then clamp inside the room. */
function snapPosition([x, z], w, d) {
  return clampPos([snapToCell(x), snapToCell(z)], w, d)
}

/* Tidy staggered spot for a freshly added model so they don't overlap. */
function nextPosition(index) {
  const cols = 6
  const gap = 3.0
  const col = index % cols
  const row = Math.floor(index / cols)
  const x = -((cols - 1) * gap) / 2 + col * gap
  const z = -5.5 + row * gap
  return snapPosition([x, z], 0, 0)
}

/* Loads a .glb, clones it, and sits its base on the floor, centered. */
function Model({ url }) {
  const { scene } = useGLTF(url)
  const obj = useMemo(() => scene.clone(true), [scene])
  const offset = useMemo(() => {
    const box = new Box3().setFromObject(obj)
    const center = box.getCenter(new Vector3())
    return [-center.x, -box.min.y, -center.z]
  }, [obj])
  return <primitive object={obj} position={offset} />
}

function PlacedModel({
  item,
  color,
  position,
  rot,
  isSelected,
  isDragging,
  onSelect,
  onStartDrag,
  onDrag,
  onEndDrag,
  onRemove,
}) {
  const [w, , d] = item.size
  const [hovered, setHovered] = useState(false)
  const lit = hovered || isDragging || isSelected
  const ringColor = isSelected ? '#3fa9ff' : '#ffffff'

  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rot, 0]}>
      <group
        onPointerDown={(e) => {
          e.stopPropagation()
          // Capture so THIS object keeps receiving move/up events even if the
          // cursor slides off it — works for every object, not just the first.
          e.target.setPointerCapture(e.pointerId)
          onSelect()
          onStartDrag()
          document.body.style.cursor = 'grabbing'
        }}
        onPointerMove={(e) => {
          if (!isDragging) return
          e.stopPropagation()
          if (e.ray.intersectPlane(DRAG_PLANE, HIT)) onDrag([HIT.x, HIT.z])
        }}
        onPointerUp={(e) => {
          if (!isDragging) return
          e.stopPropagation()
          e.target.releasePointerCapture(e.pointerId)
          onEndDrag()
          document.body.style.cursor = 'grab'
        }}
        onContextMenu={(e) => {
          e.stopPropagation()
          e.nativeEvent.preventDefault()
          onRemove()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          if (!isDragging) document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          setHovered(false)
          if (!isDragging) document.body.style.cursor = 'auto'
        }}
      >
        <Suspense fallback={null}>
          <Model url={modelUrl(item, color)} />
        </Suspense>
      </group>

      {/* Footprint highlight on the floor (selection / hover feedback) */}
      {lit && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}

      <Html position={[0, item.size[1] + 0.4, 0]} center distanceFactor={16} wrapperClass="box-label-wrap">
        <div className="box-label">{item.label}</div>
      </Html>
    </group>
  )
}

function Floor({ onHover, onLeave, onDeselect }) {
  return (
    <>
      {/* Solid floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#e9dcc2" />
      </mesh>

      {/* 1x1 meter grid (not raycastable so it never blocks the floor below) */}
      <Grid
        position={[0, 0.01, 0]}
        args={[ROOM.width, ROOM.depth]}
        cellSize={1}
        cellThickness={1}
        cellColor="#b9a684"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#8a6f48"
        infiniteGrid={false}
        fadeDistance={60}
        fadeStrength={1}
        raycast={() => null}
      />

      {/* Transparent interaction plane on top — hover cell + click-to-deselect. */}
      <mesh
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onDeselect()
        }}
        onPointerMove={(e) => {
          e.stopPropagation()
          onHover([e.point.x, e.point.z])
        }}
        onPointerOut={onLeave}
      >
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}

/* Yellow square that lights up the 1x1 cell under the cursor. */
function CellHighlight({ cell }) {
  if (!cell) return null
  return (
    <mesh position={[cell[0], 0.04, cell[1]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#ffd54a" transparent opacity={0.4} />
    </mesh>
  )
}

const WALL_H = 3.2
const RED = '#c60001'

// Each wall's local frame: +Z points into the room, X runs along the wall,
// Y is up. rotY=0 and ±90° keep text un-mirrored; the +Z wall uses 180°
// (fine for the symmetric doors).
const WALL_DEFS = {
  back: { pos: [0, 0, -HALF_D], rotY: 0, span: ROOM.width }, // faced on entry → sign
  front: { pos: [0, 0, HALF_D], rotY: Math.PI, span: ROOM.width }, // opposite → doors
  left: { pos: [-HALF_W, 0, 0], rotY: Math.PI / 2, span: ROOM.depth },
  right: { pos: [HALF_W, 0, 0], rotY: -Math.PI / 2, span: ROOM.depth },
}

/* Two sliding glass doors with frame + tracks (stylised, flat on the wall). */
function SlidingDoors() {
  const W = 3.2
  const H = 2.4
  const metal = '#2f3438'
  return (
    <group>
      {/* dark frame backing */}
      <mesh position={[0, H / 2, 0.03]} raycast={() => null}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      {/* two glass panels */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * W * 0.245, H / 2, 0.05]} raycast={() => null}>
          <planeGeometry args={[W * 0.44, H * 0.84]} />
          <meshStandardMaterial color="#bfe6f2" transparent opacity={0.45} roughness={0.1} metalness={0.1} />
        </mesh>
      ))}
      {/* center mullion + top/bottom tracks */}
      <mesh position={[0, H / 2, 0.06]} raycast={() => null}>
        <planeGeometry args={[0.08, H * 0.9]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      <mesh position={[0, H - 0.07, 0.07]} raycast={() => null}>
        <planeGeometry args={[W + 0.2, 0.14]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      <mesh position={[0, 0.05, 0.07]} raycast={() => null}>
        <planeGeometry args={[W + 0.2, 0.1]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      {/* handles */}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[s * 0.18, 1.05, 0.07]} raycast={() => null}>
          <planeGeometry args={[0.05, 0.5]} />
          <meshStandardMaterial color="#d8dde0" />
        </mesh>
      ))}
    </group>
  )
}

/* The KOPERASI MERAH PUTIH wall sign. */
function SignText() {
  return (
    <group position={[0, 0, 0.05]}>
      <Text position={[0, 2.2, 0]} fontSize={0.42} color={RED} anchorX="center" anchorY="middle" letterSpacing={0.06} material-side={FrontSide} raycast={() => null}>
        KOPERASI
      </Text>
      <Text position={[0, 1.5, 0]} fontSize={0.82} color={RED} anchorX="center" anchorY="middle" letterSpacing={0.02} material-side={FrontSide} raycast={() => null}>
        MERAH PUTIH
      </Text>
    </group>
  )
}

function Walls() {
  return (
    <group>
      {/* White shell — back-face culled so the near wall never blocks the view. */}
      <mesh position={[0, WALL_H / 2, 0]} raycast={() => null}>
        <boxGeometry args={[ROOM.width, WALL_H, ROOM.depth]} />
        <meshStandardMaterial color="#f4ede0" side={BackSide} />
      </mesh>

      {Object.entries(WALL_DEFS).map(([name, def]) => (
        <group key={name} position={def.pos} rotation={[0, def.rotY, 0]}>
          {/* Red band across the top of the wall */}
          <mesh position={[0, WALL_H - 0.3, 0.02]} raycast={() => null}>
            <planeGeometry args={[def.span, 0.6]} />
            <meshStandardMaterial color={RED} side={FrontSide} />
          </mesh>
          {name === 'front' && <SlidingDoors />}
          {name === 'back' && <SignText />}
        </group>
      ))}
    </group>
  )
}

/* Row of clickable colour swatches. */
function ColorPicker({ colors, active, onPick, size = 18 }) {
  if (colors.length < 2) return null
  return (
    <div className="color-dots">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-dot${c === active ? ' is-active' : ''}`}
          style={{ background: COLOR_HEX[c], width: size, height: size }}
          title={c}
          onClick={(e) => {
            e.stopPropagation()
            onPick(c)
          }}
        />
      ))}
    </div>
  )
}

export default function Interior({ onExit }) {
  const [objects, setObjects] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [hoverCell, setHoverCell] = useState(null)
  // Chosen colour per item type for the *next* placement (defaults to first).
  const [pickColor, setPickColor] = useState(() =>
    Object.fromEntries(ITEMS.map((i) => [i.type, defaultColor(i)])),
  )
  const dragActive = draggingId !== null

  const counts = useMemo(() => {
    const c = {}
    for (const o of objects) c[o.type] = (c[o.type] || 0) + 1
    return c
  }, [objects])

  const selected = objects.find((o) => o.id === selectedId) || null

  const addItem = (type, color) => {
    setObjects((prev) => {
      const used = prev.filter((o) => o.type === type).length
      if (used >= MAX_PER_ITEM) return prev
      const position = nextPosition(prev.length)
      const id = ++idSeq
      setSelectedId(id)
      return [...prev, { id, type, color, position, rot: 0 }]
    })
  }

  const removeItem = (id) => setObjects((prev) => prev.filter((o) => o.id !== id))

  // Move the object currently being dragged, snapping to the grid.
  const dragTo = (id, point) => {
    setHoverCell([snapToCell(point[0]), snapToCell(point[1])])
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const [w, d] = footprint(ITEM_BY_TYPE[o.type].size, o.rot)
        return { ...o, position: snapPosition(point, w, d) }
      }),
    )
  }

  const rotateSelected = () => {
    if (selectedId == null) return
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== selectedId) return o
        const rot = o.rot + QUARTER
        const [w, d] = footprint(ITEM_BY_TYPE[o.type].size, rot)
        return { ...o, rot, position: clampPos(o.position, w, d) }
      }),
    )
  }

  const recolorSelected = (color) =>
    setObjects((prev) => prev.map((o) => (o.id === selectedId ? { ...o, color } : o)))

  // Keyboard: R rotates, Delete/Backspace removes the selection.
  useEffect(() => {
    const onKey = (e) => {
      if (selectedId == null) return
      if (e.key === 'r' || e.key === 'R') rotateSelected()
      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeItem(selectedId)
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  return (
    <div className="interior">
      <Canvas
        camera={{ position: [0, 14, 17], fov: 50 }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <color attach="background" args={['#2a2018']} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[8, 16, 6]} intensity={1.0} />
        <directionalLight position={[-6, 10, -8]} intensity={0.4} />

        <Floor
          onHover={(p) => setHoverCell([snapToCell(p[0]), snapToCell(p[1])])}
          onLeave={() => setHoverCell(null)}
          onDeselect={() => setSelectedId(null)}
        />
        <Walls />
        <CellHighlight cell={hoverCell} />

        {objects.map((o) => (
          <PlacedModel
            key={o.id}
            item={ITEM_BY_TYPE[o.type]}
            color={o.color}
            position={o.position}
            rot={o.rot}
            isSelected={o.id === selectedId}
            isDragging={o.id === draggingId}
            onSelect={() => setSelectedId(o.id)}
            onStartDrag={() => setDraggingId(o.id)}
            onDrag={(point) => dragTo(o.id, point)}
            onEndDrag={() => setDraggingId(null)}
            onRemove={() => removeItem(o.id)}
          />
        ))}

        <OrbitControls
          makeDefault
          enabled={!dragActive}
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={6}
          maxDistance={40}
          enablePan
        />
      </Canvas>

      {/* --- Build menu (HUD over the canvas) --- */}
      <aside className="build-menu">
        <header className="build-menu__head">
          <span className="build-menu__title">Tata Ruang Interior</span>
          <span className="build-menu__sub">{ROOM.width} × {ROOM.depth} m · grid 1 m</span>
        </header>

        <div className="build-menu__items">
          {ITEMS.map((item) => {
            const used = counts[item.type] || 0
            const full = used >= MAX_PER_ITEM
            const chosen = pickColor[item.type]
            const swatch = chosen ? COLOR_HEX[chosen] : '#9a6536'
            return (
              <div className="item-row" key={item.type}>
                <button
                  type="button"
                  className="item-btn"
                  disabled={full}
                  onClick={() => addItem(item.type, chosen)}
                >
                  <span className="item-btn__swatch" style={{ background: swatch }} />
                  <span className="item-btn__label">{item.label}</span>
                  <span className="item-btn__count">{used}/{MAX_PER_ITEM}</span>
                </button>
                <ColorPicker
                  colors={item.colors}
                  active={chosen}
                  onPick={(c) =>
                    setPickColor((prev) => ({ ...prev, [item.type]: c }))
                  }
                />
              </div>
            )
          })}
        </div>

        <p className="build-menu__hint">
          Pilih warna lalu klik item · seret untuk memindah · klik kanan untuk menghapus
        </p>
      </aside>

      {/* --- Selection toolbar --- */}
      <div className="select-bar">
        {selected ? (
          <>
            <span className="select-bar__name">{ITEM_BY_TYPE[selected.type].label}</span>
            <ColorPicker
              colors={ITEM_BY_TYPE[selected.type].colors}
              active={selected.color}
              onPick={recolorSelected}
              size={22}
            />
            <button type="button" className="tool-btn" onClick={rotateSelected}>
              ⟳ Putar 90°
            </button>
            <button
              type="button"
              className="tool-btn tool-btn--danger"
              onClick={() => {
                removeItem(selected.id)
                setSelectedId(null)
              }}
            >
              🗑 Hapus
            </button>
          </>
        ) : (
          <span className="select-bar__hint">Pilih objek untuk mengubah warna, memutar, atau menghapus</span>
        )}
      </div>

      <button type="button" className="interior__exit" onClick={onExit}>
        ◂ Keluar
      </button>
    </div>
  )
}
