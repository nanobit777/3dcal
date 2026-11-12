import type {
  Filament,
  FilamentInput,
  PricingConfig,
  Quote,
  QuoteInput,
  QuoteListResponse,
  QuoteResponse,
} from '../shared/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // El servidor no devolvió JSON; se mantiene el mensaje genérico.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  getConfig: () => request<PricingConfig>('/config'),
  updateConfig: (config: PricingConfig) =>
    request<PricingConfig>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  listFilaments: () => request<Filament[]>('/filaments'),
  getFilament: (id: string) => request<Filament>(`/filaments/${encodeURIComponent(id)}`),
  createFilament: (input: FilamentInput) =>
    request<Filament>('/filaments', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateFilament: (id: string, input: FilamentInput) =>
    request<Filament>(`/filaments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteFilament: (id: string) =>
    request<{ ok: true }>(`/filaments/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  listQuotes: (query: string, page: number) =>
    request<QuoteListResponse>(
      `/quotes?q=${encodeURIComponent(query)}&page=${encodeURIComponent(String(page))}`,
    ),
  getQuote: (id: string) => request<Quote>(`/quotes/${encodeURIComponent(id)}`),
  createQuote: (input: QuoteInput) =>
    request<QuoteResponse>('/quotes', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  calculateQuote: (input: QuoteInput) =>
    request<QuoteResponse>('/calculate', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  deleteQuote: (id: string) =>
    request<{ ok: true }>(`/quotes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
