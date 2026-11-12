import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { api } from '../api';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import type { PricingConfig } from '../../shared/types';

interface FormState {
  electricityClpKwh: string;
  printerPowerKw: string;
  maintenancePerHourClp: string;
  laborRateClpH: string;
  defaultMarginPct: string;
}

const emptyForm: FormState = {
  electricityClpKwh: '',
  printerPowerKw: '',
  maintenancePerHourClp: '',
  laborRateClpH: '',
  defaultMarginPct: '',
};

function toForm(config: PricingConfig): FormState {
  return {
    electricityClpKwh: String(config.electricityClpKwh),
    printerPowerKw: String(config.printerPowerKw),
    maintenancePerHourClp: String(config.maintenancePerHourClp),
    laborRateClpH: String(config.laborRateClpH),
    defaultMarginPct: String(config.defaultMarginPct),
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    api
      .getConfig()
      .then((config) => {
        if (active) {
          setForm(toForm(config));
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudo cargar la configuración.');
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const config: PricingConfig = {
      electricityClpKwh: Number(form.electricityClpKwh),
      printerPowerKw: Number(form.printerPowerKw),
      maintenancePerHourClp: Number(form.maintenancePerHourClp),
      laborRateClpH: Number(form.laborRateClpH),
      defaultMarginPct: Number(form.defaultMarginPct),
    };

    if (Object.values(config).some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Todos los valores deben ser números mayores o iguales a 0.');
      return;
    }

    setSaving(true);
    try {
      const saved = await api.updateConfig(config);
      setForm(toForm(saved));
      setSuccess('Configuración guardada.');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Tarifas base usadas por la calculadora. Cada cotización guarda una copia de estos valores."
      />

      {error ? <Alert variant="danger" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert> : null}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Cargando configuración…
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="electricityClpKwh">Precio de la luz (CLP/kWh)</label>
                <input
                  id="electricityClpKwh"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.electricityClpKwh}
                  onChange={(event) => update('electricityClpKwh', event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="printerPowerKw">Potencia de la impresora (kW)</label>
                <input
                  id="printerPowerKw"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.printerPowerKw}
                  onChange={(event) => update('printerPowerKw', event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="maintenancePerHourClp">
                  Mantenimiento/depreciación (CLP/hora)
                </label>
                <input
                  id="maintenancePerHourClp"
                  className="form-control"
                  type="number"
                  min="0"
                  step="1"
                  value={form.maintenancePerHourClp}
                  onChange={(event) => update('maintenancePerHourClp', event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="laborRateClpH">Mano de obra (CLP/hora)</label>
                <input
                  id="laborRateClpH"
                  className="form-control"
                  type="number"
                  min="0"
                  step="1"
                  value={form.laborRateClpH}
                  onChange={(event) => update('laborRateClpH', event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="defaultMarginPct">Margen por defecto (%)</label>
                <input
                  id="defaultMarginPct"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.defaultMarginPct}
                  onChange={(event) => update('defaultMarginPct', event.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="card-footer bg-transparent d-flex justify-content-end">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              ) : (
                <i className="bi bi-check-lg me-2" />
              )}
              Guardar configuración
            </button>
          </div>
        </form>
      )}
    </>
  );
}
