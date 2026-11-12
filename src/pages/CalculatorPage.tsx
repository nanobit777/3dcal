import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import { filamentLabel } from '../../shared/format';
import { calculateQuote, formatClp } from '../../shared/pricing';
import type { PricingResult } from '../../shared/pricing';
import type { Filament, PricingConfig, Quote, QuoteInput } from '../../shared/types';

interface FormState {
  pieceName: string;
  filamentId: string;
  grams: string;
  printHours: string;
  laborHours: string;
  extraCostsClp: string;
  marginPct: string;
  saveToHistory: boolean;
  notes: string;
}

const emptyForm: FormState = {
  pieceName: '',
  filamentId: '',
  grams: '',
  printHours: '',
  laborHours: '0',
  extraCostsClp: '0',
  marginPct: '',
  saveToHistory: true,
  notes: '',
};

function toNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

export default function CalculatorPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [savedQuote, setSavedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([api.getConfig(), api.listFilaments()])
      .then(([configData, filamentsData]) => {
        if (!active) {
          return;
        }
        const activeFilaments = filamentsData.filter((filament) => filament.active);
        setConfig(configData);
        setFilaments(activeFilaments);
        setForm((current) => ({
          ...current,
          marginPct: current.marginPct || String(configData.defaultMarginPct),
          filamentId: current.filamentId || activeFilaments[0]?.id || '',
        }));
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los datos.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setResult(null);
  }, [form]);

  const selectedFilament = filaments.find((filament) => filament.id === form.filamentId) ?? null;

  const preview = useMemo<PricingResult | null>(() => {
    if (!config || !selectedFilament) {
      return null;
    }

    const grams = toNumber(form.grams);
    const printHours = toNumber(form.printHours);
    const laborHours = toNumber(form.laborHours);
    const extraCostsClp = toNumber(form.extraCostsClp);
    const marginPct = toNumber(form.marginPct);

    if (
      !Number.isFinite(grams) ||
      grams <= 0 ||
      !Number.isFinite(printHours) ||
      printHours < 0 ||
      !Number.isFinite(laborHours) ||
      laborHours < 0 ||
      !Number.isFinite(extraCostsClp) ||
      extraCostsClp < 0 ||
      !Number.isFinite(marginPct) ||
      marginPct < 0
    ) {
      return null;
    }

    return calculateQuote({
      pricePerKgClp: selectedFilament.pricePerKgClp,
      grams,
      printHours,
      laborHours,
      extraCostsClp,
      marginPct,
      electricityClpKwh: config.electricityClpKwh,
      printerPowerKw: config.printerPowerKw,
      maintenancePerHourClp: config.maintenancePerHourClp,
      laborRateClpH: config.laborRateClpH,
    });
  }, [config, form, selectedFilament]);

  const shownResult = result ?? preview;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavedQuote(null);

    if (!selectedFilament) {
      setError('Selecciona un filamento.');
      return;
    }

    const input: QuoteInput = {
      pieceName: form.pieceName.trim(),
      filamentId: form.filamentId,
      grams: toNumber(form.grams),
      printHours: toNumber(form.printHours),
      laborHours: toNumber(form.laborHours),
      extraCostsClp: toNumber(form.extraCostsClp),
      marginPct: toNumber(form.marginPct),
      saveToHistory: form.saveToHistory,
      notes: form.notes.trim(),
    };

    if (!(input.grams > 0)) {
      setError('Los gramos usados deben ser mayores a 0.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.createQuote(input);
      setResult(response.result);
      setSavedQuote(response.quote);
      setSuccess(
        response.quote
          ? 'Cotización guardada en el historial.'
          : 'Cálculo realizado. No se guardó en el historial.',
      );
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'No se pudo calcular la cotización.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Calculadora"
        subtitle="Calcula el precio de una pieza a partir del filamento, la energía, la mano de obra y el margen."
        actions={
          <Link className="btn btn-outline-secondary" to="/filamentos">
            <i className="bi bi-box-seam" /> Gestionar filamentos
          </Link>
        }
      />

      {error ? <Alert variant="danger" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}{' '}
          {savedQuote ? (
            <Link to={`/historial/${savedQuote.id}`} className="alert-link">
              Ver cotización
            </Link>
          ) : null}
        </Alert>
      ) : null}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Cargando datos…
        </div>
      ) : null}

      {!loading && filaments.length === 0 ? (
        <div className="card empty-state">
          <div className="card-body">
            <h2 className="h5">Todavía no hay filamentos activos</h2>
            <p className="text-secondary">
              Agrega al menos un filamento al catálogo para poder calcular el costo del material.
            </p>
            <Link className="btn btn-primary" to="/filamentos/nuevo">
              <i className="bi bi-plus-lg" /> Nuevo filamento
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && filaments.length > 0 ? (
        <div className="row g-4">
          <div className="col-lg-7">
            <form className="card" onSubmit={handleSubmit}>
              <div className="card-body">
                <h2 className="h5 mb-3">Datos de la pieza</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="pieceName">Nombre de la pieza</label>
                    <input
                      id="pieceName"
                      className="form-control"
                      maxLength={160}
                      value={form.pieceName}
                      onChange={(event) => update('pieceName', event.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="filamentId">Filamento</label>
                    <select
                      id="filamentId"
                      className="form-select"
                      value={form.filamentId}
                      onChange={(event) => update('filamentId', event.target.value)}
                      required
                    >
                      <option value="">Selecciona un filamento</option>
                      {filaments.map((filament) => (
                        <option key={filament.id} value={filament.id}>
                          {filamentLabel(filament)} — {formatClp(filament.pricePerKgClp)}/kg
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="grams">Gramos usados</label>
                    <input
                      id="grams"
                      className="form-control"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.grams}
                      onChange={(event) => update('grams', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="printHours">Horas de impresión</label>
                    <input
                      id="printHours"
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.printHours}
                      onChange={(event) => update('printHours', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="laborHours">Horas de trabajo</label>
                    <input
                      id="laborHours"
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.laborHours}
                      onChange={(event) => update('laborHours', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="extraCostsClp">Costos extra (CLP)</label>
                    <input
                      id="extraCostsClp"
                      className="form-control"
                      type="number"
                      min="0"
                      step="1"
                      value={form.extraCostsClp}
                      onChange={(event) => update('extraCostsClp', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="marginPct">Margen de ganancia (%)</label>
                    <input
                      id="marginPct"
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.marginPct}
                      onChange={(event) => update('marginPct', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="form-check mb-2">
                      <input
                        id="saveToHistory"
                        className="form-check-input"
                        type="checkbox"
                        checked={form.saveToHistory}
                        onChange={(event) => update('saveToHistory', event.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="saveToHistory">
                        Guardar en historial
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="notes">Notas</label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows={2}
                      value={form.notes}
                      onChange={(event) => update('notes', event.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="card-footer bg-transparent d-flex justify-content-end">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  ) : (
                    <i className="bi bi-calculator me-2" />
                  )}
                  {form.saveToHistory ? 'Calcular y guardar' : 'Calcular'}
                </button>
              </div>
            </form>
          </div>

          <div className="col-lg-5">
            <div className="card">
              <div className="card-body">
                <h2 className="h5 mb-3">Desglose de costos</h2>
                {shownResult ? (
                  <>
                    <dl className="row mb-0">
                      <dt className="col-7 fw-normal">Material</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(shownResult.materialCost)}</dd>
                      <dt className="col-7 fw-normal">Luz</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(shownResult.electricityCost)}</dd>
                      <dt className="col-7 fw-normal">Mano de obra</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(shownResult.laborCost)}</dd>
                      <dt className="col-7 fw-normal">Mantenimiento</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(shownResult.maintenanceCost)}</dd>
                      <dt className="col-7 fw-normal">Costos extra</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(toNumber(form.extraCostsClp))}</dd>
                    </dl>
                    <hr />
                    <dl className="row mb-0">
                      <dt className="col-7">Subtotal</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(shownResult.subtotal)}</dd>
                      <dt className="col-7 fw-normal">Margen ({form.marginPct || '0'}%)</dt>
                      <dd className="col-5 text-end money-cell">{formatClp(shownResult.marginAmount)}</dd>
                    </dl>
                    <hr />
                    <div className="d-flex justify-content-between align-items-end">
                      <span className="text-uppercase text-secondary small">Precio final</span>
                      <span className="result-total">{formatClp(shownResult.finalPrice)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-secondary mb-0">
                    Completa el filamento, los gramos y las horas para ver el desglose.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
