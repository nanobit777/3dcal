import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import { MATERIALS } from '../../shared/types';
import type { FilamentInput, Material } from '../../shared/types';

interface FormState {
  brand: string;
  material: Material;
  colorName: string;
  pricePerKgClp: string;
  active: boolean;
  notes: string;
}

const emptyForm: FormState = {
  brand: '',
  material: 'PLA',
  colorName: '',
  pricePerKgClp: '',
  active: true,
  notes: '',
};

export default function FilamentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;
    api
      .getFilament(id)
      .then((filament) => {
        if (active) {
          setForm({
            brand: filament.brand,
            material: filament.material,
            colorName: filament.colorName,
            pricePerKgClp: String(filament.pricePerKgClp),
            active: filament.active,
            notes: filament.notes,
          });
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudo cargar el filamento.');
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
  }, [id]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const pricePerKgClp = Number(form.pricePerKgClp);
    if (!Number.isFinite(pricePerKgClp) || pricePerKgClp <= 0) {
      setError('El precio por kilo debe ser mayor a 0.');
      return;
    }

    const input: FilamentInput = {
      brand: form.brand.trim(),
      material: form.material,
      colorName: form.colorName.trim(),
      pricePerKgClp: Math.round(pricePerKgClp),
      active: form.active,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (id) {
        await api.updateFilament(id, input);
      } else {
        await api.createFilament(input);
      }
      navigate('/filamentos');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el filamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={editing ? 'Editar filamento' : 'Nuevo filamento'}
        subtitle="Solo el precio por kilo es obligatorio; el resto ayuda a identificarlo."
        actions={
          <Link className="btn btn-outline-secondary" to="/filamentos">
            <i className="bi bi-arrow-left" /> Volver
          </Link>
        }
      />

      {error ? <Alert variant="danger" onClose={() => setError('')}>{error}</Alert> : null}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Cargando filamento…
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="brand">Marca</label>
                <input
                  id="brand"
                  className="form-control"
                  maxLength={80}
                  value={form.brand}
                  onChange={(event) => update('brand', event.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="material">Material</label>
                <select
                  id="material"
                  className="form-select"
                  value={form.material}
                  onChange={(event) => update('material', event.target.value as Material)}
                >
                  {MATERIALS.map((material) => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="colorName">Color</label>
                <input
                  id="colorName"
                  className="form-control"
                  maxLength={80}
                  value={form.colorName}
                  onChange={(event) => update('colorName', event.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="pricePerKgClp">Precio por kilo (CLP)</label>
                <input
                  id="pricePerKgClp"
                  className="form-control"
                  type="number"
                  min="1"
                  step="1"
                  value={form.pricePerKgClp}
                  onChange={(event) => update('pricePerKgClp', event.target.value)}
                  required
                />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    id="active"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => update('active', event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="active">
                    Activo (disponible en la calculadora)
                  </label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="notes">Notas</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-footer bg-transparent d-flex justify-content-end gap-2">
            <Link className="btn btn-outline-secondary" to="/filamentos">Cancelar</Link>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              ) : (
                <i className="bi bi-check-lg me-2" />
              )}
              Guardar
            </button>
          </div>
        </form>
      )}
    </>
  );
}
