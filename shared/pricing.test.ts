import { describe, expect, it } from 'vitest';

import { calculateQuote, formatClp } from './pricing';

describe('calculateQuote', () => {
  it('replica el caso de prueba original de Django', () => {
    const result = calculateQuote({
      pricePerKgClp: 20000,
      grams: 100,
      printHours: 10,
      laborHours: 1,
      extraCostsClp: 500,
      marginPct: 40,
      electricityClpKwh: 200,
      printerPowerKw: 0.12,
      maintenancePerHourClp: 1000,
      laborRateClpH: 5000,
    });

    expect(result.materialCost).toBe(2000);
    expect(result.electricityCost).toBe(240);
    expect(result.laborCost).toBe(5000);
    expect(result.maintenanceCost).toBe(10000);
    expect(result.subtotal).toBe(17740);
    expect(result.marginAmount).toBe(7096);
    expect(result.finalPrice).toBe(24836);
  });

  it('redondea el precio final al peso entero con ROUND_HALF_UP', () => {
    const result = calculateQuote({
      pricePerKgClp: 10000,
      grams: 1,
      printHours: 0,
      laborHours: 0,
      extraCostsClp: 0,
      marginPct: 0,
      electricityClpKwh: 0,
      printerPowerKw: 0,
      maintenancePerHourClp: 0,
      laborRateClpH: 0,
    });

    expect(result.materialCost).toBe(10);
    expect(result.finalPrice).toBe(10);
  });
});

describe('formatClp', () => {
  it('formatea pesos chilenos', () => {
    expect(formatClp(24836)).toBe('$24.836');
  });
});
