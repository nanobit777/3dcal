import { getStore } from '@netlify/blobs';

import type { Filament, PricingConfig, Quote } from '../../../shared/types';

const store = getStore({ name: '3dcal', consistency: 'strong' });

export const DEFAULT_CONFIG: PricingConfig = {
  electricityClpKwh: 200,
  printerPowerKw: 0.12,
  maintenancePerHourClp: 1000,
  laborRateClpH: 5000,
  defaultMarginPct: 40,
};

function normalizeConfig(raw: Partial<PricingConfig> | null): PricingConfig {
  return {
    electricityClpKwh: Number(raw?.electricityClpKwh ?? DEFAULT_CONFIG.electricityClpKwh),
    printerPowerKw: Number(raw?.printerPowerKw ?? DEFAULT_CONFIG.printerPowerKw),
    maintenancePerHourClp: Number(raw?.maintenancePerHourClp ?? DEFAULT_CONFIG.maintenancePerHourClp),
    laborRateClpH: Number(raw?.laborRateClpH ?? DEFAULT_CONFIG.laborRateClpH),
    defaultMarginPct: Number(raw?.defaultMarginPct ?? DEFAULT_CONFIG.defaultMarginPct),
  };
}

function getBlob<T>(key: string): Promise<T | null> {
  return store.get(key, { type: 'json', consistency: 'strong' }) as Promise<T | null>;
}

async function listByPrefix<T>(prefix: string): Promise<T[]> {
  const { blobs } = await store.list({ prefix });
  const rows = await Promise.all(blobs.map((blob) => getBlob<T>(blob.key)));
  return rows.filter((row) => row !== null) as unknown as T[];
}

export async function getConfig(): Promise<PricingConfig> {
  const existing = await getBlob<Partial<PricingConfig>>('config');
  if (existing) {
    return normalizeConfig(existing);
  }

  const created = await store.setJSON('config', DEFAULT_CONFIG, { onlyIfNew: true });
  if (created.modified) {
    return DEFAULT_CONFIG;
  }

  const afterRace = await getBlob<Partial<PricingConfig>>('config');
  return normalizeConfig(afterRace);
}

export async function saveConfig(config: PricingConfig): Promise<PricingConfig> {
  const normalized = normalizeConfig(config);
  await store.setJSON('config', normalized);
  return normalized;
}

export async function listFilaments(): Promise<Filament[]> {
  const filaments = await listByPrefix<Filament>('filaments/');
  return filaments.sort((a, b) => {
    const left = `${a.brand} ${a.material} ${a.colorName}`;
    const right = `${b.brand} ${b.material} ${b.colorName}`;
    return left.localeCompare(right, 'es');
  });
}

export async function getFilament(id: string): Promise<Filament | null> {
  return getBlob<Filament>(`filaments/${id}`);
}

export async function saveFilament(filament: Filament): Promise<Filament> {
  await store.setJSON(`filaments/${filament.id}`, filament);
  return filament;
}

export async function deleteFilament(id: string): Promise<void> {
  await store.delete(`filaments/${id}`);

  const quotes = await listQuotes();
  const affected = quotes.filter((quote) => quote.filamentId === id);
  await Promise.all(
    affected.map((quote) => saveQuote({ ...quote, filamentId: null })),
  );
}

export async function listQuotes(): Promise<Quote[]> {
  const quotes = await listByPrefix<Quote>('quotes/');
  return quotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getQuote(id: string): Promise<Quote | null> {
  return getBlob<Quote>(`quotes/${id}`);
}

export async function saveQuote(quote: Quote): Promise<Quote> {
  await store.setJSON(`quotes/${quote.id}`, quote);
  return quote;
}

export async function deleteQuote(id: string): Promise<void> {
  await store.delete(`quotes/${id}`);
}
