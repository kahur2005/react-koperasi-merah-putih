export const PRODUCTS = {
  rice: {
    id: 'rice',
    label: 'Rice',
    role: 'essential',
    baseCapacity: 100,
    safeStockRatio: 0.3,
    companyBuyPrice: 10000,
    baseSellPrice: 12000,
    localSupplier: 'Rice farmers',
    sectorType: 'rice',
    isEssential: true,
  },
  fruit: {
    id: 'fruit',
    label: 'Fruit',
    role: 'daily',
    baseCapacity: 80,
    safeStockRatio: 0.25,
    companyBuyPrice: 6000,
    baseSellPrice: 8000,
    localSupplier: 'Fruit farmers',
    sectorType: 'fruit',
    isEssential: false,
  },
  gas: {
    id: 'gas',
    label: 'Cooking Gas',
    role: 'essential',
    baseCapacity: 60,
    safeStockRatio: 0.3,
    companyBuyPrice: 17000,
    baseSellPrice: 20000,
    localSupplier: 'Gas seller partner',
    sectorType: 'gas',
    isEssential: true,
  },
}

export const PRODUCT_IDS = Object.keys(PRODUCTS)
export const ESSENTIAL_PRODUCT_IDS = PRODUCT_IDS.filter((id) => PRODUCTS[id].isEssential)
