import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api';
import { Alert } from '../components/Alert';
import { PageHeader } from '../components/PageHeader';
import { formatDate, formatDateTime } from '../../shared/format';
import { formatClp } from '../../shared/pricing';
import type { Quote } from '../../shared/types';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-sm-6">
      <div className="small text-secondary">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;
    api
      .getQuote(id)
      .then((data) => {
        if (active) {
          setQuote(data);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'No se pudo cargar la cotización.');
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

  async function handleDelete() {
    if (!quote) {
      return;
    }
    if (!window.confirm('¿Eliminar esta cotización?')) {
      return;
    }

    try {
      await api.deleteQuote(quote.id);
      navigate('/historial');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'No se pudo eliminar la cotización.');
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-secondary">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        Cargando cotización…
      </div>
    );
  }

  if (error && !quote) {
    return (
      <>
        <Alert variant="danger">{error}</Alert>
        <Link className="btn btn-outline-secondary" to="/historial">
          <i className="bi bi-arrow-left" /> Volver al historial
        </Link>
      </>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={quote.pieceName || 'Cotización sin nombre'}
        subtitle={`Guardada el ${formatDateTime(quote.createdAt)}`}
        actions={
          <>
            <Link className="btn btn-outline-secondary" to="/historial">
              <i className="bi bi-arrow-left" /> Volver
            </Link>
            <button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete()}>
              <i className="bi bi-trash" /> Eliminar
            </button>
          </>
        }
      />

      {error ? <Alert variant="danger" onClose={() => setError('')}>{error}</Alert> : null}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Datos de la cotización</h2>
              <div className="row g-3">
                <DetailRow label="Fecha de la cotización" value={formatDate(quote.quoteDate)} />
                <DetailRow label="Filamento" value={quote.filamentName} />
                <DetailRow label="Precio del filamento" value={`${formatClp(quote.pricePerKgClp)} / kg`} />
                <DetailRow label="Gramos usados" value={`${quote.grams} g`} />
                <DetailRow label="Horas de impresión" value={`${quote.printHours} h`} />
                <DetailRow label="Horas de trabajo" value={`${quote.laborHours} h`} />
                <DetailRow label="Precio de la luz" value={`${formatClp(quote.electricityClpKwh)} / kWh`} />
                <DetailRow label="Potencia de la impresora" value={`${quote.printerPowerKw} kW`} />
                <DetailRow label="Mantenimiento" value={`${formatClp(quote.maintenancePerHourClp)} / h`} />
                <DetailRow label="Mano de obra" value={`${formatClp(quote.laborRateClpH)} / h`} />
                <DetailRow label="Costos extra" value={formatClp(quote.extraCostsClp)} />
                <DetailRow label="Margen" value={`${quote.marginPct}%`} />
              </div>
              {quote.notes ? (
                <>
                  <hr />
                  <h3 className="h6">Notas</h3>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{quote.notes}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Desglose</h2>
              <dl className="row mb-0">
                <dt className="col-7 fw-normal">Material</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.materialCostClp)}</dd>
                <dt className="col-7 fw-normal">Luz</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.electricityCostClp)}</dd>
                <dt className="col-7 fw-normal">Mano de obra</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.laborCostClp)}</dd>
                <dt className="col-7 fw-normal">Mantenimiento</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.maintenanceCostClp)}</dd>
                <dt className="col-7 fw-normal">Costos extra</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.extraCostsClp)}</dd>
              </dl>
              <hr />
              <dl className="row mb-0">
                <dt className="col-7">Subtotal</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.subtotalCostClp)}</dd>
                <dt className="col-7 fw-normal">Margen ({quote.marginPct}%)</dt>
                <dd className="col-5 text-end money-cell">{formatClp(quote.marginAmountClp)}</dd>
              </dl>
              <hr />
              <div className="d-flex justify-content-between align-items-end">
                <span className="text-uppercase text-secondary small">Precio final</span>
                <span className="result-total">{formatClp(quote.finalPriceClp)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
