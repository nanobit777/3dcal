export const MATERIALS = ['PLA', 'PLA+', 'PETG', 'ABS', 'TPU', 'OTRO'] as const;

export type Material = (typeof MATERIALS)[number];

export interface PricingConfig {
  electricityClpKwh: number;
  printerPowerKw: number;
  maintenancePerHourClp: number;
  laborRateClpH: number;
  defaultMarginPct: number;
}

export interface Filament {
  id: string;
  brand: string;
  material: Material;
  colorName: string;
  pricePerKgClp: number;
  active: boolean;
  notes: string;
  createdAt: string;
}

export interface FilamentInput {
  brand: string;
  material: Material;
  colorName: string;
  pricePerKgClp: number;
  active: boolean;
  notes: string;
}

export interface Quote {
  id: string;
  createdAt: string;
  quoteDate: string;
  pieceName: string;
  filamentId: string | null;
  filamentName: string;
  pricePerKgClp: number;
  grams: number;
  printHours: number;
  laborHours: number;
  electricityClpKwh: number;
  printerPowerKw: number;
  maintenancePerHourClp: number;
  laborRateClpH: number;
  extraCostsClp: number;
  marginPct: number;
  materialCostClp: number;
  electricityCostClp: number;
  laborCostClp: number;
  maintenanceCostClp: number;
  subtotalCostClp: number;
  marginAmountClp: number;
  finalPriceClp: number;
  notes: string;
}

export interface QuoteInput {
  pieceName: string;
  filamentId: string;
  grams: number;
  printHours: number;
  laborHours: number;
  extraCostsClp: number;
  marginPct: number;
  saveToHistory: boolean;
  notes: string;
  quoteDate?: string;
}

export interface QuoteListResponse {
  quotes: Quote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
}

export interface QuoteResponse {
  result: import('./pricing').PricingResult;
  quote: Quote | null;
}
