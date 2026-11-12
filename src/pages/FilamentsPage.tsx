import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import { filamentLabel } from '../../shared/format';
import { formatClp } from '../../shared/pricing';
import type { Filament } from '../../shared/types';

export default function FilamentsPage() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .listFilaments()
      .then((data) => {
        if (active) {
          setFilaments(data);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudo cargar el catálogo.');
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
  }, [reloadKey]);

  async function handleDelete(filament: Filament) {
    setError('');
    setNotice('');
    const confirmed = window.confirm(`¿Eliminar "${filamentLabel(filament)}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.deleteFilament(filament.id);
      setNotice('Filamento eliminado.');
      setReloadKey((key) => key + 1);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'No se pudo eliminar el filamento.');
    }
  }

  return (
    <>
      <PageHeader
        title="Filamentos"
        subtitle="Catálogo de materiales y precios por kilo. Solo se usan filamentos activos en la calculadora."
        actions={
          <Link className="btn btn-primary" to="/filamentos/nuevo">
            <i className="bi bi-plus-lg" /> Nuevo filamento
          </Link>
        }
      />

      {error ? <Alert variant="danger" onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert variant="success" onClose={() => setNotice('')}>{notice}</Alert> : null}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Cargando filamentos…
        </div>
      ) : null}

      {!loading && filaments.length === 0 ? (
        <div className="card empty-state">
          <div className="card-body">
            <h2 className="h5">El catálogo está vacío</h2>
            <p className="text-secondary mb-3">Agrega tu primer filamento para empezar a calcular.</p>
            <Link className="btn btn-primary" to="/filamentos/nuevo">
              <i className="bi bi-plus-lg" /> Nuevo filamento
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && filaments.length > 0 ? (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Material</th>
                  <th>Color</th>
                  <th className="text-end">Precio/kg</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filaments.map((filament) => (
                  <tr key={filament.id}>
                    <td>{filament.brand || '—'}</td>
                    <td>{filament.material}</td>
                    <td>{filament.colorName || '—'}</td>
                    <td className="text-end money-cell">{formatClp(filament.pricePerKgClp)}</td>
                    <td>
                      {filament.active ? (
                        <span className="badge text-bg-success">Activo</span>
                      ) : (
                        <span className="badge text-bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link className="btn btn-outline-secondary" to={`/filamentos/${filament.id}/editar`}>
                          <i className="bi bi-pencil" /> Editar
                        </Link>
                        <button
                          className="btn btn-outline-danger"
                          type="button"
                          onClick={() => void handleDelete(filament)}
                        >
                          <i className="bi bi-trash" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
