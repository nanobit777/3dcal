import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { api } from '../api';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import { formatDate } from '../../shared/format';
import { formatClp } from '../../shared/pricing';
import type { QuoteListResponse } from '../../shared/types';

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const requestedPage = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const [search, setSearch] = useState(query);
  const [data, setData] = useState<QuoteListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .listQuotes(query, requestedPage)
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudo cargar el historial.');
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
  }, [query, requestedPage, reloadKey]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = search.trim();
    if (trimmed) {
      params.set('q', trimmed);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params);
  }

  async function handleDelete(id: string, pieceName: string) {
    setError('');
    setNotice('');
    if (!window.confirm(`¿Eliminar la cotización "${pieceName || 'sin nombre'}"?`)) {
      return;
    }

    try {
      await api.deleteQuote(id);
      setNotice('Cotización eliminada.');
      setReloadKey((key) => key + 1);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'No se pudo eliminar la cotización.');
    }
  }

  return (
    <>
      <PageHeader
        title="Historial"
        subtitle="Cada cotización guarda una copia de las tarifas usadas en el momento del cálculo."
        actions={
          <Link className="btn btn-primary" to="/">
            <i className="bi bi-calculator" /> Nueva cotización
          </Link>
        }
      />

      {error ? <Alert variant="danger" onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert variant="success" onClose={() => setNotice('')}>{notice}</Alert> : null}

      <form className="row g-2 mb-3" onSubmit={handleSearch}>
        <div className="col-sm-8 col-md-6">
          <input
            className="form-control"
            type="search"
            placeholder="Buscar por pieza o filamento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-outline-secondary" type="submit">
            <i className="bi bi-search" /> Buscar
          </button>
        </div>
        {query ? (
          <div className="col-auto">
            <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchParams({})}>
              Limpiar
            </button>
          </div>
        ) : null}
      </form>

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Cargando historial…
        </div>
      ) : null}

      {!loading && data && data.total === 0 ? (
        <div className="card empty-state">
          <div className="card-body">
            <h2 className="h5">No hay cotizaciones</h2>
            <p className="text-secondary mb-3">
              {query ? 'No se encontraron resultados para la búsqueda.' : 'Calcula una pieza y guárdala para verla aquí.'}
            </p>
            <Link className="btn btn-primary" to="/">
              <i className="bi bi-calculator" /> Ir a la calculadora
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && data && data.total > 0 ? (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pieza</th>
                    <th>Filamento</th>
                    <th className="text-end">Precio final</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>{formatDate(quote.quoteDate)}</td>
                      <td>{quote.pieceName || <span className="text-secondary">Sin nombre</span>}</td>
                      <td>{quote.filamentName}</td>
                      <td className="text-end money-cell">{formatClp(quote.finalPriceClp)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link className="btn btn-outline-secondary" to={`/historial/${quote.id}`}>
                            <i className="bi bi-eye" /> Ver
                          </Link>
                          <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={() => void handleDelete(quote.id, quote.pieceName)}
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

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
            <span className="text-secondary small">
              {data.total} cotización{data.total === 1 ? '' : 'es'} · página {data.page} de {data.totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={data.page <= 1}
                onClick={() => goToPage(data.page - 1)}
              >
                <i className="bi bi-chevron-left" /> Anterior
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => goToPage(data.page + 1)}
              >
                Siguiente <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
