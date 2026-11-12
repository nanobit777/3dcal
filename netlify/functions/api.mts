import type { Context } from '@netlify/functions';

import { filamentLabel } from '../../shared/format';
import { calculateQuote, todayInSantiago } from '../../shared/pricing';
import type {
  Filament,
  FilamentInput,
  Material,
  PricingConfig,
  Quote,
  QuoteInput,
  QuoteListResponse,
  QuoteResponse,
} from '../../shared/types';
import { MATERIALS } from '../../shared/types';
import {
  asObject,
  errorResponse,
  HttpError,
  jsonResponse,
  readJson,
  readNumber,
  readString,
} from './lib/http';
import {
  deleteFilament,
  deleteQuote,
  getConfig,
  getFilament,
  getQuote,
  listFilaments,
  listQuotes,
  saveConfig,
  saveFilament,
  saveQuote,
} from './lib/store';

const PAGE_SIZE = 20;

function parseConfigInput(body: unknown, current: PricingConfig): PricingConfig {
  const data = asObject(body);
  const next: PricingConfig = {
    electricityClpKwh: readNumber(data.electricityClpKwh, current.electricityClpKwh),
    printerPowerKw: readNumber(data.printerPowerKw, current.printerPowerKw),
    maintenancePerHourClp: readNumber(data.maintenancePerHourClp, current.maintenancePerHourClp),
    laborRateClpH: readNumber(data.laborRateClpH, current.laborRateClpH),
    defaultMarginPct: readNumber(data.defaultMarginPct, current.defaultMarginPct),
  };

  if (next.electricityClpKwh < 0) {
    throw new HttpError('El precio de la luz no puede ser negativo.');
  }
  if (next.printerPowerKw < 0) {
    throw new HttpError('La potencia de la impresora no puede ser negativa.');
  }
  if (next.maintenancePerHourClp < 0) {
    throw new HttpError('El costo de mantenimiento no puede ser negativo.');
  }
  if (next.laborRateClpH < 0) {
    throw new HttpError('La tarifa de mano de obra no puede ser negativa.');
  }
  if (next.defaultMarginPct < 0) {
    throw new HttpError('El margen por defecto no puede ser negativo.');
  }

  return next;
}

function parseFilamentInput(body: unknown): FilamentInput {
  const data = asObject(body);
  const material = readString(data.material) as Material;
  if (!MATERIALS.includes(material)) {
    throw new HttpError('Material inválido.');
  }

  const pricePerKgClp = readNumber(data.pricePerKgClp);
  if (!(pricePerKgClp > 0)) {
    throw new HttpError('El precio por kilo debe ser mayor a 0.');
  }

  return {
    brand: readString(data.brand),
    material,
    colorName: readString(data.colorName),
    pricePerKgClp: Math.round(pricePerKgClp),
    active: data.active === undefined ? true : Boolean(data.active),
    notes: readString(data.notes),
  };
}

function parseQuoteInput(body: unknown): QuoteInput {
  const data = asObject(body);
  const filamentId = readString(data.filamentId);
  if (!filamentId) {
    throw new HttpError('Selecciona un filamento.');
  }

  const grams = readNumber(data.grams);
  if (!(grams > 0)) {
    throw new HttpError('Los gramos deben ser mayores a 0.');
  }

  const printHours = readNumber(data.printHours);
  if (printHours < 0) {
    throw new HttpError('Las horas de impresión no pueden ser negativas.');
  }

  const laborHours = readNumber(data.laborHours);
  if (laborHours < 0) {
    throw new HttpError('Las horas de trabajo no pueden ser negativas.');
  }

  const extraCostsClp = readNumber(data.extraCostsClp);
  if (extraCostsClp < 0) {
    throw new HttpError('Los costos extra no pueden ser negativos.');
  }

  const marginPct = readNumber(data.marginPct);
  if (marginPct < 0) {
    throw new HttpError('El margen no puede ser negativo.');
  }

  const quoteDate = readString(data.quoteDate) || todayInSantiago();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quoteDate)) {
    throw new HttpError('La fecha de la cotización no es válida.');
  }

  return {
    pieceName: readString(data.pieceName),
    filamentId,
    grams,
    printHours,
    laborHours,
    extraCostsClp,
    marginPct,
    saveToHistory: data.saveToHistory !== false,
    notes: readString(data.notes),
    quoteDate,
  };
}

async function buildQuote(
  input: QuoteInput,
  persist: boolean,
): Promise<{ result: ReturnType<typeof calculateQuote>; quote: Quote | null }> {
  const [config, filament] = await Promise.all([getConfig(), getFilament(input.filamentId)]);
  if (!filament) {
    throw new HttpError('Filamento no encontrado.', 404);
  }

  const result = calculateQuote({
    pricePerKgClp: filament.pricePerKgClp,
    grams: input.grams,
    printHours: input.printHours,
    laborHours: input.laborHours,
    extraCostsClp: input.extraCostsClp,
    marginPct: input.marginPct,
    electricityClpKwh: config.electricityClpKwh,
    printerPowerKw: config.printerPowerKw,
    maintenancePerHourClp: config.maintenancePerHourClp,
    laborRateClpH: config.laborRateClpH,
  });

  if (!persist) {
    return { result, quote: null };
  }

  const quote: Quote = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    quoteDate: input.quoteDate ?? todayInSantiago(),
    pieceName: input.pieceName,
    filamentId: filament.id,
    filamentName: filamentLabel(filament),
    pricePerKgClp: filament.pricePerKgClp,
    grams: input.grams,
    printHours: input.printHours,
    laborHours: input.laborHours,
    electricityClpKwh: config.electricityClpKwh,
    printerPowerKw: config.printerPowerKw,
    maintenancePerHourClp: config.maintenancePerHourClp,
    laborRateClpH: config.laborRateClpH,
    extraCostsClp: input.extraCostsClp,
    marginPct: input.marginPct,
    materialCostClp: result.materialCost,
    electricityCostClp: result.electricityCost,
    laborCostClp: result.laborCost,
    maintenanceCostClp: result.maintenanceCost,
    subtotalCostClp: result.subtotal,
    marginAmountClp: result.marginAmount,
    finalPriceClp: result.finalPrice,
    notes: input.notes,
  };

  await saveQuote(quote);
  return { result, quote };
}

async function handleQuoteHistory(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = readString(url.searchParams.get('q')).toLocaleLowerCase('es');
  const requestedPage = Math.max(1, Math.floor(readNumber(url.searchParams.get('page'), 1)));

  const allQuotes = await listQuotes();
  const filtered = query
    ? allQuotes.filter((quote) => {
        const haystack = `${quote.pieceName} ${quote.filamentName}`.toLocaleLowerCase('es');
        return haystack.includes(query);
      })
    : allQuotes;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const quotes = filtered.slice(start, start + PAGE_SIZE);

  const body: QuoteListResponse = {
    quotes,
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    query,
  };

  return jsonResponse(body);
}

async function route(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = (url.pathname
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '') || '/');
  const method = request.method.toUpperCase();

  if (path === '/config') {
    if (method === 'GET') {
      return jsonResponse(await getConfig());
    }
    if (method === 'PUT') {
      const current = await getConfig();
      const body = await readJson<unknown>(request);
      return jsonResponse(await saveConfig(parseConfigInput(body, current)));
    }
    return errorResponse('Método no permitido.', 405);
  }

  if (path === '/filaments') {
    if (method === 'GET') {
      return jsonResponse(await listFilaments());
    }
    if (method === 'POST') {
      const body = await readJson<unknown>(request);
      const input = parseFilamentInput(body);
      const filament: Filament = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      return jsonResponse(await saveFilament(filament), 201);
    }
    return errorResponse('Método no permitido.', 405);
  }

  const filamentMatch = path.match(/^\/filaments\/([^/]+)$/);
  if (filamentMatch) {
    const id = decodeURIComponent(filamentMatch[1]);
    if (method === 'GET') {
      const filament = await getFilament(id);
      return filament ? jsonResponse(filament) : errorResponse('Filamento no encontrado.', 404);
    }
    if (method === 'PUT') {
      const existing = await getFilament(id);
      if (!existing) {
        return errorResponse('Filamento no encontrado.', 404);
      }
      const body = await readJson<unknown>(request);
      const input = parseFilamentInput(body);
      return jsonResponse(await saveFilament({ ...existing, ...input }));
    }
    if (method === 'DELETE') {
      const existing = await getFilament(id);
      if (!existing) {
        return errorResponse('Filamento no encontrado.', 404);
      }
      await deleteFilament(id);
      return jsonResponse({ ok: true });
    }
    return errorResponse('Método no permitido.', 405);
  }

  if (path === '/quotes') {
    if (method === 'GET') {
      return handleQuoteHistory(request);
    }
    if (method === 'POST') {
      const body = await readJson<unknown>(request);
      const input = parseQuoteInput(body);
      const response: QuoteResponse = await buildQuote(input, input.saveToHistory);
      return jsonResponse(response, response.quote ? 201 : 200);
    }
    return errorResponse('Método no permitido.', 405);
  }

  const quoteMatch = path.match(/^\/quotes\/([^/]+)$/);
  if (quoteMatch) {
    const id = decodeURIComponent(quoteMatch[1]);
    if (method === 'GET') {
      const quote = await getQuote(id);
      return quote ? jsonResponse(quote) : errorResponse('Cotización no encontrada.', 404);
    }
    if (method === 'DELETE') {
      const quote = await getQuote(id);
      if (!quote) {
        return errorResponse('Cotización no encontrada.', 404);
      }
      await deleteQuote(id);
      return jsonResponse({ ok: true });
    }
    return errorResponse('Método no permitido.', 405);
  }

  if (path === '/calculate') {
    if (method !== 'POST') {
      return errorResponse('Método no permitido.', 405);
    }
    const body = await readJson<unknown>(request);
    const input = parseQuoteInput(body);
    return jsonResponse(await buildQuote(input, false));
  }

  return errorResponse('Ruta no encontrada.', 404);
}

export default async (request: Request, _context: Context): Promise<Response> => {
  try {
    return await route(request);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status);
    }
    console.error('Error inesperado en /api:', error);
    return errorResponse('Error interno del servidor.', 500);
  }
};
