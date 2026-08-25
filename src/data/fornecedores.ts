export interface SupplierPlateHeatExchanger {
  id: string
  brand: string
  modelCode: string
  modelSeries?: string
  plateCount: number
  plateMaterial: string
  plateThicknessMm: number
  gasketMaterial: string
  connectionSize: string
  testPressureBar: number
  maxPressureBar: number
  widthMm: number
  heightMm: number
  depthMm: number
  weightKg: number
  basePriceBrl?: number
  description?: string
}

export const SUPPLIERS_DATABASE: SupplierPlateHeatExchanger[] = [
  {
    id: 'alf-m10-bfg',
    brand: 'Alfa Laval / BERMO',
    modelCode: 'M10-BFG',
    modelSeries: 'Industrial Line M',
    plateCount: 55,
    plateMaterial: 'AISI 316L',
    plateThicknessMm: 0.5,
    gasketMaterial: 'EPDM Clip-on',
    connectionSize: 'DN100 (4")',
    testPressureBar: 16,
    maxPressureBar: 10,
    widthMm: 480,
    heightMm: 1450,
    depthMm: 1120,
    weightKg: 520,
    basePriceBrl: 48500,
    description: 'Trocador de calor a placas desmontável industrial Alfa Laval M10-BFG',
  },
  {
    id: 'alf-tl10-p',
    brand: 'Alfa Laval / BERMO',
    modelCode: 'TL10-P',
    modelSeries: 'TL Standard Line',
    plateCount: 65,
    plateMaterial: 'AISI 316L',
    plateThicknessMm: 0.5,
    gasketMaterial: 'EPDM Clip-on',
    connectionSize: 'DN100 (4")',
    testPressureBar: 16,
    maxPressureBar: 10,
    widthMm: 500,
    heightMm: 1520,
    depthMm: 1250,
    weightKg: 580,
    basePriceBrl: 54000,
    description: 'Trocador de calor Alfa Laval TL10-P alta eficiência térmica',
  },
  {
    id: 'alf-m6-mfg',
    brand: 'Alfa Laval / BERMO',
    modelCode: 'M6-MFG',
    modelSeries: 'Industrial Line M',
    plateCount: 40,
    plateMaterial: 'AISI 316',
    plateThicknessMm: 0.5,
    gasketMaterial: 'NBR Clip-on',
    connectionSize: 'DN65 (2.1/2")',
    testPressureBar: 16,
    maxPressureBar: 10,
    widthMm: 340,
    heightMm: 980,
    depthMm: 780,
    weightKg: 240,
    basePriceBrl: 29500,
    description: 'Trocador de calor compacto desmontável Alfa Laval M6-MFG',
  },
  {
    id: 'alf-m15-bfg',
    brand: 'Alfa Laval / BERMO',
    modelCode: 'M15-BFG',
    modelSeries: 'Industrial Line M',
    plateCount: 85,
    plateMaterial: 'AISI 316L',
    plateThicknessMm: 0.6,
    gasketMaterial: 'EPDM Clip-on',
    connectionSize: 'DN150 (6")',
    testPressureBar: 16,
    maxPressureBar: 12,
    widthMm: 620,
    heightMm: 1850,
    depthMm: 1450,
    weightKg: 950,
    basePriceBrl: 89000,
    description: 'Trocador de grande porte Alfa Laval M15-BFG',
  },
  {
    id: 'alf-t20-m',
    brand: 'Alfa Laval / BERMO',
    modelCode: 'T20-M',
    modelSeries: 'Industrial Line T',
    plateCount: 110,
    plateMaterial: 'AISI 316L',
    plateThicknessMm: 0.6,
    gasketMaterial: 'NBR Glued',
    connectionSize: 'DN200 (8")',
    testPressureBar: 20,
    maxPressureBar: 16,
    widthMm: 780,
    heightMm: 2200,
    depthMm: 1800,
    weightKg: 1650,
    basePriceBrl: 145000,
    description: 'Trocador de alto volume e vazão Alfa Laval T20-M',
  },
  {
    id: 'kel-nt100m',
    brand: 'Kelvion / GEA',
    modelCode: 'NT100M',
    modelSeries: 'NT Series OptiWave',
    plateCount: 50,
    plateMaterial: 'AISI 316L',
    plateThicknessMm: 0.5,
    gasketMaterial: 'EPDM EcoLoc',
    connectionSize: 'DN100 (4")',
    testPressureBar: 16,
    maxPressureBar: 10,
    widthMm: 460,
    heightMm: 1400,
    depthMm: 1050,
    weightKg: 490,
    basePriceBrl: 46000,
    description: 'Trocador Kelvion NT100M com canal de fluxo OptiWave',
  },
  {
    id: 'dan-xg10',
    brand: 'Danfoss / Sondex',
    modelCode: 'Sondex S14A',
    modelSeries: 'Standard Plate',
    plateCount: 45,
    plateMaterial: 'AISI 316L',
    plateThicknessMm: 0.5,
    gasketMaterial: 'SonderLock EPDM',
    connectionSize: 'DN65 (2.1/2")',
    testPressureBar: 16,
    maxPressureBar: 10,
    widthMm: 380,
    heightMm: 1150,
    depthMm: 850,
    weightKg: 310,
    basePriceBrl: 34000,
    description: 'Trocador Sondex S14A desmontável com travamento SonderLock',
  },
]

export function registerSupplierEquipment(equipment: SupplierPlateHeatExchanger): void {
  const existingIndex = SUPPLIERS_DATABASE.findIndex(
    (item) => item.modelCode.toLowerCase() === equipment.modelCode.toLowerCase(),
  )
  if (existingIndex >= 0) {
    SUPPLIERS_DATABASE[existingIndex] = { ...SUPPLIERS_DATABASE[existingIndex], ...equipment }
  } else {
    SUPPLIERS_DATABASE.unshift(equipment)
  }
}

export function lookupEquipmentSpecs(query: string): SupplierPlateHeatExchanger | undefined {
  if (!query || !query.trim()) return undefined
  const clean = query.trim().toLowerCase()
  return SUPPLIERS_DATABASE.find(
    (item) =>
      item.modelCode.toLowerCase() === clean ||
      item.modelCode.toLowerCase().replace(/[-_ ]/g, '') === clean.replace(/[-_ ]/g, ''),
  )
}

export function searchEquipmentModel(query: string): SupplierPlateHeatExchanger[] {
  if (!query || !query.trim()) return []
  const clean = query.trim().toLowerCase()
  return SUPPLIERS_DATABASE.filter(
    (item) =>
      item.modelCode.toLowerCase().includes(clean) ||
      item.brand.toLowerCase().includes(clean) ||
      (item.modelSeries && item.modelSeries.toLowerCase().includes(clean)),
  )
}
