import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout.jsx';
import Breadcrumb from '@/components/layout/Breadcrumb.jsx';
import KpiBar from '@/components/tablero/KpiBar.jsx';
// import GraficoEstados from '@/components/tablero/GraficoEstados.jsx';
import FiltrosBar from '@/components/tablero/FiltrosBar.jsx';
import SelectorColumnas from '@/components/tablero/SelectorColumnas.jsx';
import TablaExpedientes from '@/components/tablero/TablaExpedientes.jsx';
import { listarExpedientes, obtenerMetricas, obtenerResponsables } from '@/services/expedientes.service.js';
import { COLUMNAS_TABLA, COLUMNAS_DEFAULT_KEYS } from '@/config/columnas.jsx';

const FILTROS_INICIALES = { busqueda: '', estado: '', provincia: '', responsable: '' };
const LS_COLUMNAS = 'renapdis.columnasVisibles';

// Carga las columnas visibles guardadas, filtrando keys que ya no existen en el catálogo.
// (A futuro este set inicial vendrá de los permisos de rol del usuario.)
function cargarColumnasVisibles() {
  try {
    const raw = localStorage.getItem(LS_COLUMNAS);
    if (!raw) return COLUMNAS_DEFAULT_KEYS;
    const keys = JSON.parse(raw);
    const validas = keys.filter((k) => COLUMNAS_TABLA.some((c) => c.key === k));
    return validas.length ? validas : COLUMNAS_DEFAULT_KEYS;
  } catch {
    return COLUMNAS_DEFAULT_KEYS;
  }
}

export default function Tablero() {
  const [expedientes, setExpedientes] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  const [columnasVisibles, setColumnasVisibles] = useState(cargarColumnasVisibles);

  const responsables = obtenerResponsables();

  // Persistir la selección de columnas del usuario.
  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNAS, JSON.stringify(columnasVisibles));
    } catch {
      /* localStorage no disponible: se ignora, no es crítico para el mock */
    }
  }, [columnasVisibles]);

  const toggleColumna = (key) => {
    setColumnasVisibles((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetColumnas = () => setColumnasVisibles(COLUMNAS_DEFAULT_KEYS);

  // Columnas activas en el orden del catálogo (no en el orden de tildado).
  const columnasActivas = COLUMNAS_TABLA.filter((c) => columnasVisibles.includes(c.key));

  const cargarMetricas = useCallback(async () => {
    setLoadingMetricas(true);
    const m = await obtenerMetricas();
    setMetricas(m);
    setLoadingMetricas(false);
  }, []);

  const cargarExpedientes = useCallback(async (f) => {
    setLoading(true);
    const data = await listarExpedientes(f);
    setExpedientes(data);
    setLoading(false);
    setPagina(1);
  }, []);

  useEffect(() => { cargarMetricas(); }, [cargarMetricas]);
  useEffect(() => { cargarExpedientes(filtros); }, [filtros, cargarExpedientes]);

  const handleFiltroKpi = (estado) => {
    setFiltros((f) => ({ ...f, estado: f.estado === estado ? '' : estado }));
  };

  const handleLimpiarEstado = () => {
    setFiltros((f) => ({ ...f, estado: '' }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
  };

  return (
    <Layout>
      <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'Trámites' }]} />

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-strong)', margin: '0 0 6px' }}>
          Trámites
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: 0 }}>
          Seguimiento de expedientes de habilitación de plataformas digitales de salud.
        </p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <KpiBar
          metricas={metricas}
          loading={loadingMetricas}
          filtroEstado={filtros.estado}
          onFiltroEstado={handleFiltroKpi}
          onLimpiar={handleLimpiarEstado}
        />
      </div>

      {/* <div style={{ marginBottom: 28 }}>
        <GraficoEstados metricas={metricas} />
      </div> */}

      <div style={{ marginBottom: 20 }}>
        <FiltrosBar
          filtros={filtros}
          onChange={setFiltros}
          onLimpiar={handleLimpiarFiltros}
          responsables={responsables}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <SelectorColumnas
          columnas={COLUMNAS_TABLA}
          visibles={columnasVisibles}
          onToggle={toggleColumna}
          onReset={resetColumnas}
        />
      </div>

      <TablaExpedientes
        expedientes={expedientes}
        loading={loading}
        pagina={pagina}
        onPaginaChange={setPagina}
        columnas={columnasActivas}
      />
    </Layout>
  );
}
