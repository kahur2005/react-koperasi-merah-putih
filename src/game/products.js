// Product catalogue. Rice and gas are the two required staples; running out of
// either reduces spawns and zeroes the membership chance.
export const PRODUCTS = {
  rice: { id: 'rice', label: 'Beras', price: 12000, isRequired: true },
  gas: { id: 'gas', label: 'Gas LPG', price: 18000, isRequired: true },
  veggies: { id: 'veggies', label: 'Sayur & Buah', price: 8000, isRequired: false },
  umkm: { id: 'umkm', label: 'Produk UMKM', price: 15000, isRequired: false },
}

export const PRODUCT_IDS = Object.keys(PRODUCTS)
export const REQUIRED_PRODUCT_IDS = PRODUCT_IDS.filter((id) => PRODUCTS[id].isRequired)
