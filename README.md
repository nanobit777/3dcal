# PrintControl 3D

Aplicación web para calcular el precio de piezas de impresión 3D según el filamento usado, la luz, la mano de obra, el mantenimiento y el margen de ganancia.

Esta versión está pensada para ejecutarse directamente en **Netlify**:

- **Frontend:** React + Vite + TypeScript (sitio estático en el CDN de Netlify).
- **Backend:** Netlify Functions (`/api/*`, runtime JavaScript/TypeScript).
- **Datos:** Netlify Blobs (almacenamiento JSON server-side, incluido en el plan Free).

Incluye:

- **Calculadora**: desglose de costos y precio final.
- **Catálogo de filamentos**: nombre/marca, material, color y precio por kilo.
- **Historial**: cada cotización guarda una copia de las tarifas usadas.
- **Configuración**: precio de la luz, potencia de la impresora, mantenimiento, mano de obra y margen por defecto.

No usa login ni sesiones de usuario.

## Requisitos

- Node.js 22+
- Netlify CLI (incluido como dependencia de desarrollo)

## Ejecución local

Solo interfaz (sin API):

```powershell
npm run dev
```

App completa (emula Netlify Functions y Blobs):

```powershell
npm run dev:netlify
```

La primera vez, `netlify dev` puede pedir vincular el proyecto con Netlify (`netlify link`).

## Pruebas y verificación

```powershell
npm run typecheck
npm run test
npm run build
```

## Despliegue en Netlify

1. Sube el repositorio a GitHub.
2. En Netlify, importa el repositorio.
3. Configuración detectada por `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Despliega. Netlify Blobs se aprovisiona automáticamente.

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

El redondeo se hace con `ROUND_HALF_UP` y el precio final queda en pesos enteros.

## Estructura

```
netlify/functions/api.mts     API /api/*
netlify/functions/lib/        Acceso a Blobs y helpers HTTP
shared/pricing.ts             Fórmula compartida frontend/backend
shared/types.ts               Tipos de datos
src/                          Aplicación React
```

## Datos

Los datos viven en el store `3dcal` de Netlify Blobs:

- `config` → configuración de precios.
- `filaments/{id}` → un blob por filamento.
- `quotes/{id}` → un blob por cotización.

Para respaldar los datos, usa la sección **Blobs** del panel de Netlify y descarga el store.

## Seguridad

La app no tiene autenticación. Cualquier persona con la URL puede ver y modificar los datos, igual que en la versión anterior. Si vas a publicarla de forma abierta, considera agregar protección de acceso en Netlify o un token simple en la API.
