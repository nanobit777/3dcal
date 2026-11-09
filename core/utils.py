from decimal import Decimal, ROUND_HALF_UP

def clp_format(value):
    try:
        if value is None:
            value = 0
        # Format as CLP with thousand separators
        v = int(round(float(value)))
        return f'$' + '{:,}'.format(v).replace(',', '.')
    except Exception:
        return f''

def round_decimal(val, places=2):
    q = Decimal(10) ** -places
    return Decimal(str(val)).quantize(q, rounding=ROUND_HALF_UP)