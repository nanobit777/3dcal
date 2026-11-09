from decimal import Decimal, ROUND_HALF_UP


def _dec(value):
    return Decimal(str(value or 0))


def _money(value):
    return _dec(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def _clp(value):
    return _dec(value).quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def calculate_quote(
    *,
    price_per_kg_clp,
    grams,
    print_hours,
    labor_hours,
    extra_costs_clp,
    margin_pct,
    electricity_clp_kwh,
    printer_power_kw,
    maintenance_per_hour_clp,
    labor_rate_clp_h,
):
    price_per_kg_clp = _dec(price_per_kg_clp)
    grams = _dec(grams)
    print_hours = _dec(print_hours)
    labor_hours = _dec(labor_hours)
    extra_costs_clp = _dec(extra_costs_clp)
    margin_pct = _dec(margin_pct)
    electricity_clp_kwh = _dec(electricity_clp_kwh)
    printer_power_kw = _dec(printer_power_kw)
    maintenance_per_hour_clp = _dec(maintenance_per_hour_clp)
    labor_rate_clp_h = _dec(labor_rate_clp_h)

    material_cost = price_per_kg_clp * grams / Decimal('1000')
    electricity_cost = electricity_clp_kwh * printer_power_kw * print_hours
    labor_cost = labor_rate_clp_h * labor_hours
    maintenance_cost = maintenance_per_hour_clp * print_hours

    subtotal = material_cost + electricity_cost + labor_cost + maintenance_cost + extra_costs_clp
    margin_amount = subtotal * margin_pct / Decimal('100')
    final_price = subtotal + margin_amount

    return {
        'material_cost': _money(material_cost),
        'electricity_cost': _money(electricity_cost),
        'labor_cost': _money(labor_cost),
        'maintenance_cost': _money(maintenance_cost),
        'subtotal': _money(subtotal),
        'margin_amount': _money(margin_amount),
        'final_price': _clp(final_price),
    }
