import { useNavigate } from 'react-router-dom';
import styles from './TablaExpedientes.module.css';

const FILAS_POR_PAGINA = 10;

function buildPaginasVisibles(pagina, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (pagina > 3) pages.push('...');
  for (let i = Math.max(2, pagina - 1); i <= Math.min(total - 1, pagina + 1); i++) {
    pages.push(i);
  }
  if (pagina < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function PagBtn({ children, activo, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[styles.pagBtn, activo ? styles.pagBtnActivo : ''].join(' ').trim()}
    >
      {children}
    </button>
  );
}

export default function TablaExpedientes({ expedientes, loading, pagina, onPaginaChange, columnas = [] }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={styles.tablaWrapper}>
        <div className={styles.cargando}>
          <span className={styles.spinner} aria-hidden="true" />
          <span>Cargando expedientes...</span>
        </div>
      </div>
    );
  }

  if (!expedientes || expedientes.length === 0) {
    return (
      <div className={styles.vacio}>
        <div className={styles.vacioTitulo}>No se encontraron expedientes</div>
        <div className={styles.vacioDetalle}>Ajustá los filtros de búsqueda para ver resultados</div>
      </div>
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(expedientes.length / FILAS_POR_PAGINA));
  const paginaSegura = Math.min(Math.max(pagina || 1, 1), totalPaginas);
  const inicio = (paginaSegura - 1) * FILAS_POR_PAGINA;
  const filas = expedientes.slice(inicio, inicio + FILAS_POR_PAGINA);
  const paginasVisibles = buildPaginasVisibles(paginaSegura, totalPaginas);

  return (
    <div>
      <div className={styles.tablaWrapper}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.key} className={styles.th}>{col.label}</th>
              ))}
              <th className={styles.th} style={{ width: 90 }} aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((row, i) => (
              <tr key={row.id} className={i % 2 === 1 ? styles.filaAlterna : ''}>
                {columnas.map((col) => (
                  <td key={col.key} className={styles.td}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                <td className={styles.td}>
                  <button
                    type="button"
                    onClick={() => navigate(`/expediente/${row.id}`)}
                    className={styles.btnVer}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.paginacion}>
        <span className={styles.resumen}>
          Mostrando {inicio + 1}–{Math.min(inicio + FILAS_POR_PAGINA, expedientes.length)} de{' '}
          <strong className={styles.resumenFuerte}>{expedientes.length.toLocaleString('es-AR')}</strong> trámites
        </span>

        {totalPaginas > 1 && (
          <div className={styles.paginas}>
            <PagBtn disabled={paginaSegura === 1} onClick={() => onPaginaChange(paginaSegura - 1)}>
              &lsaquo; Anterior
            </PagBtn>
            {paginasVisibles.map((n, i) =>
              n === '...' ? (
                <span key={`dots-${i}`} className={styles.puntos}>…</span>
              ) : (
                <PagBtn key={n} activo={paginaSegura === n} onClick={() => onPaginaChange(n)}>
                  {n}
                </PagBtn>
              )
            )}
            <PagBtn disabled={paginaSegura === totalPaginas} onClick={() => onPaginaChange(paginaSegura + 1)}>
              Siguiente &rsaquo;
            </PagBtn>
          </div>
        )}
      </div>
    </div>
  );
}
