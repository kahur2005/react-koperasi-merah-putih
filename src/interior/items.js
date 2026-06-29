// Catalogue of placeable items, driven by the .glb models in /public/model.
// Files follow the convention `<base>_<color>.glb` (or `<base>.glb` when the
// model has no colour variants). `size` is the approximate footprint
// [width(x), height(y), depth(z)] in meters, used for grid snapping/clamping.
export const ITEMS = [
  {
    type: 'rak-double',
    label: 'Rak Minimarket',
    base: 'minimarket_rack_stocked',
    colors: ['red', 'blue', 'green', 'yellow'],
    size: [1.0, 2.0, 0.6],
  },
  {
    type: 'rak-single',
    label: 'Rak Minimarket 1 Sisi',
    base: 'minimarket_rack_singleside_stocked',
    colors: ['red', 'blue', 'green', 'yellow'],
    size: [1.0, 2.0, 0.5],
  },
  {
    type: 'rak-buah',
    label: 'Rak Display Buah',
    base: 'fruit_display_rack',
    colors: ['brown', 'red'],
    size: [1.2, 1.2, 0.8],
  },
  {
    type: 'kasir',
    label: 'Meja Kasir',
    base: 'cashier_counter',
    colors: ['red'],
    size: [1.5, 1.1, 0.8],
  },
  {
    type: 'gas',
    label: 'Tabung Gas LPG',
    base: 'tabung_gas_3kg_x3',
    colors: [],
    size: [0.9, 0.6, 0.4],
  },
]

// Swatch colours shown in the UI for each named variant.
export const COLOR_HEX = {
  red: '#c0322b',
  blue: '#3b6fb0',
  green: '#4a9b4a',
  yellow: '#e0b32c',
  brown: '#8a5a30',
}

export const MAX_PER_ITEM = 3

// Floor footprint in meters.
export const ROOM = { width: 20, depth: 15 }

export const ITEM_BY_TYPE = Object.fromEntries(ITEMS.map((i) => [i.type, i]))

export const defaultColor = (item) => item.colors[0] ?? null

export function modelUrl(item, color) {
  return color ? `/model/${item.base}_${color}.glb` : `/model/${item.base}.glb`
}

// Every model file we might load — used to preload so items don't pop in.
export const ALL_MODEL_URLS = ITEMS.flatMap((it) =>
  it.colors.length ? it.colors.map((c) => modelUrl(it, c)) : [modelUrl(it, null)],
)
