import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import KpiBar from '@/components/tablero/KpiBar';
import FiltrosBar from '@/components/tablero/FiltrosBar';
import SelectorColumnas from '@/components/tablero/SelectorColumnas';
import ExportarExcelButton from '@/components/tablero/ExportarExcelButton';
import TablaExpedientes from '@/components/tablero/TablaExpedientes';
import { COLUMNAS_TABLA, COLUMNAS_DEFAULT_KEYS } from '@/components/tablero/columnas.config';
import { useExpedientes } from '@/hooks/useExpedientes';
import { useMetricas } from '@/hooks/useMetricas';
import { useResponsables } from '@/hooks/useResponsables';
import type { ColumnaTabla, Estado, FiltrosExpedientes } from '@/types/expediente.types';

const FILTROS_INICIALES: FiltrosExpedientes = {
  busqueda: '',
  estado: '',
  provincia: '',
  responsable: '',
  tipo: '',
  naturalezaEntidad: '',
  ultimaModificacionDesde: '',
  ultimaModificacionHasta: '',
  orden: '',
};
const LS_COLUMNAS = 'renapdis.columnasVisibles';

// Carga las columnas visibles guardadas, filtrando keys que ya no existen en el catálogo.
// (A futuro este set inicial vendrá de los permisos de rol del usuario.)
function cargarColumnasVisibles(): ColumnaTabla['key'][] {
  try {
    const raw = localStorage.getItem(LS_COLUMNAS);
    if (!raw) return COLUMNAS_DEFAULT_KEYS;
    const keys = JSON.parse(raw) as ColumnaTabla['key'][];
    const validas = keys.filter((k) => COLUMNAS_TABLA.some((c) => c.key === k));
    return validas.length ? validas : COLUMNAS_DEFAULT_KEYS;
  } catch {
    return COLUMNAS_DEFAULT_KEYS;
  }
}

export default function Tablero() {
  const [filtros, setFiltros] = useState<FiltrosExpedientes>(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [columnasVisibles, setColumnasVisibles] = useState<ColumnaTabla['key'][]>(cargarColumnasVisibles);

  const { data: expedientes, isLoading: loading } = useExpedientes(filtros);
  const { data: metricas, isLoading: loadingMetricas } = useMetricas();
  const { data: responsables = [] } = useResponsables();

  useEffect(() => {
    setPagina(1);
  }, [filtros]);

  // Persistir la selección de columnas del usuario.
  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNAS, JSON.stringify(columnasVisibles));
    } catch {
      /* localStorage no disponible: se ignora, no es crítico para el mock */
    }
  }, [columnasVisibles]);

  const toggleColumna = (key: ColumnaTabla['key']) => {
    setColumnasVisibles((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const resetColumnas = () => setColumnasVisibles(COLUMNAS_DEFAULT_KEYS);

  // Columnas activas en el orden del catálogo (no en el orden de tildado).
  const columnasActivas = COLUMNAS_TABLA.filter((c) => columnasVisibles.includes(c.key));

  const handleFiltroKpi = (estado: Estado) => {
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

      <div className="mb-7">
        <h1 className="mb-1.5 text-[28px] font-bold text-ink-strong">Trámites</h1>
        <p className="text-sm text-ink-soft">Seguimiento de expedientes de habilitación de plataformas digitales de salud.</p>
      </div>

      <div className="mb-7">
        <KpiBar
          metricas={metricas}
          loading={loadingMetricas}
          filtroEstado={filtros.estado}
          onFiltroEstado={handleFiltroKpi}
          onLimpiar={handleLimpiarEstado}
        />
      </div>

      <div className="mb-5">
        <FiltrosBar filtros={filtros} onChange={setFiltros} onLimpiar={handleLimpiarFiltros} responsables={responsables} />
      </div>

      <div className="mb-3 flex justify-end gap-2.5">
        <ExportarExcelButton expedientes={expedientes} columnas={columnasActivas} />
        <SelectorColumnas columnas={COLUMNAS_TABLA} visibles={columnasVisibles} onToggle={toggleColumna} onReset={resetColumnas} />
      </div>

      <TablaExpedientes expedientes={expedientes} loading={loading} pagina={pagina} onPaginaChange={setPagina} columnas={columnasActivas} />
    </Layout>
  );
}
