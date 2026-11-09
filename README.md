# PrintControl 3D

Aplicación web para calcular el precio de piezas de impresión 3D según el filamento usado, la luz, la mano de obra, el mantenimiento y el margen de ganancia.

Incluye:

- **Calculadora**: desglose de costos y precio final.
- **Catálogo de filamentos**: solo nombre/marca, material, color y precio por kilo. Sin control de peso ni stock.
- **Historial**: cada cotización guarda una copia de las tarifas usadas.
- **Configuración**: precio de la luz, potencia de la impresora, mantenimiento, mano de obra y margen por defecto.

No usa login, sesiones de usuario ni panel de administración.

## Requisitos

- Python 3.11+
- Las dependencias ya están instaladas en `.venv` (Django 5.1.4).

## Ejecución

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

Abrir http://127.0.0.1:8000/

## Fórmula

```
costo_material      = precio_kg_filamento × gramos / 1000
costo_luz           = precio_kwh × potencia_kw × horas_impresion
costo_mano_obra     = tarifa_hora × horas_trabajo
costo_mantenimiento = costo_mantenimiento_hora × horas_impresion
subtotal            = material + luz + mano_obra + mantenimiento + extras
margen              = subtotal × margen_pct / 100
precio_final        = subtotal + margen
```

## Datos

- La base de datos es `db.sqlite3`.
- Los datos antiguos se importaron al nuevo catálogo e historial.
- Hay un respaldo en `backups/` y una exportación JSON en `backups/legacy_export.json`.
- Para respaldar manualmente: `python backup_db.py`.
