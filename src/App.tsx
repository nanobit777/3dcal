import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';

import CalculatorPage from './pages/CalculatorPage';
import FilamentFormPage from './pages/FilamentFormPage';
import FilamentsPage from './pages/FilamentsPage';
import HistoryPage from './pages/HistoryPage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import SettingsPage from './pages/SettingsPage';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
}

function navClassName({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? ' active' : ''}`;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('pc3d-theme', theme);
  }, [theme]);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="bi bi-printer" /> PrintControl 3D
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Abrir menú"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink className={navClassName} to="/" end>
                  <i className="bi bi-calculator" /> Calculadora
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={navClassName} to="/filamentos">
                  <i className="bi bi-box-seam" /> Filamentos
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={navClassName} to="/historial">
                  <i className="bi bi-clock-history" /> Historial
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={navClassName} to="/configuracion">
                  <i className="bi bi-sliders" /> Configuración
                </NavLink>
              </li>
            </ul>
            <button
              className="btn btn-outline-light btn-sm"
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} /> Tema
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/filamentos" element={<FilamentsPage />} />
          <Route path="/filamentos/nuevo" element={<FilamentFormPage />} />
          <Route path="/filamentos/:id/editar" element={<FilamentFormPage />} />
          <Route path="/historial" element={<HistoryPage />} />
          <Route path="/historial/:id" element={<QuoteDetailPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <div className="card">
                <div className="card-body">
                  <h1 className="h4">Página no encontrada</h1>
                  <p className="mb-3">La ruta solicitada no existe.</p>
                  <Link className="btn btn-primary" to="/">
                    Volver a la calculadora
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
    </>
  );
}
