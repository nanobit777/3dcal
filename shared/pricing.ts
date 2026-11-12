import Decimal from 'decimal.js';

export interface PricingInputs {
  pricePerKgClp: number;
  grams: number;
  printHours: number;
  laborHours: number;
  extraCostsClp: number;
  marginPct: number;
  electricityClpKwh: number;
  printerPowerKw: number;
  maintenancePerHourClp: number;
  laborRateClpH: number;
}

export interface PricingResult {
  materialCost: number;
  electricityCost: number;
  laborCost: number;
  maintenanceCost: number;
  subtotal: number;
  marginAmount: number;
  finalPrice: number;
}

function dec(value: number | string | null | undefined): Decimal {
  return new Decimal(value ?? 0);
}

function money(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function clp(value: Decimal): Decimal {
  return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function calculateQuote(input: PricingInputs): PricingResult {
  const pricePerKgClp = dec(input.pricePerKgClp);
  const grams = dec(input.grams);
  const printHours = dec(input.printHours);
  const laborHours = dec(input.laborHours);
  const extraCostsClp = dec(input.extraCostsClp);
  const marginPct = dec(input.marginPct);
  const electricityClpKwh = dec(input.electricityClpKwh);
  const printerPowerKw = dec(input.printerPowerKw);
  const maintenancePerHourClp = dec(input.maintenancePerHourClp);
  const laborRateClpH = dec(input.laborRateClpH);

  const materialCost = pricePerKgClp.times(grams).dividedBy(1000);
  const electricityCost = electricityClpKwh.times(printerPowerKw).times(printHours);
  const laborCost = laborRateClpH.times(laborHours);
  const maintenanceCost = maintenancePerHourClp.times(printHours);

  const subtotal = materialCost
    .plus(electricityCost)
    .plus(laborCost)
    .plus(maintenanceCost)
    .plus(extraCostsClp);
  const marginAmount = subtotal.times(marginPct).dividedBy(100);
  const finalPrice = subtotal.plus(marginAmount);

  return {
    materialCost: money(materialCost).toNumber(),
    electricityCost: money(electricityCost).toNumber(),
    laborCost: money(laborCost).toNumber(),
    maintenanceCost: money(maintenanceCost).toNumber(),
    subtotal: money(subtotal).toNumber(),
    marginAmount: money(marginAmount).toNumber(),
    finalPrice: clp(finalPrice).toNumber(),
  };
}

export function formatClp(value: number | string | null | undefined): string {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
}

export function todayInSantiago(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
