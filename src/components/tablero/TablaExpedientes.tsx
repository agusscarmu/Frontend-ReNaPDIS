import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnaTabla, ExpedienteResumen } from '@/types/expediente.types';

const FILAS_POR_PAGINA = 10;

interface TablaExpedientesProps {
  expedientes: ExpedienteResumen[] | undefined;
  loading: boolean;
  pagina: number;
  onPaginaChange: (pagina: number) => void;
  columnas?: ColumnaTabla[];
}

function buildPaginasVisibles(pagina: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  pages.push(1);
  if (pagina > 3) pages.push('...');
  for (let i = Math.max(2, pagina - 1); i <= Math.min(total - 1, pagina + 1); i++) {
    pages.push(i);
  }
  if (pagina < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function PagBtn({ children, activo, disabled, onClick }: { children: ReactNode; activo?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'whitespace-nowrap rounded-sm border border-surface-border px-2.5 py-1.5 text-[13px]',
        activo ? 'border-brand bg-brand font-bold text-white' : 'bg-white font-normal text-ink-medium',
        disabled ? 'cursor-not-allowed text-gray-300' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function TablaExpedientes({ expedientes, loading, pagina, onPaginaChange, columnas = [] }: TablaExpedientesProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="overflow-x-auto rounded border border-surface-border bg-surface-panel">
        <div className="flex items-center justify-center gap-3 py-[60px] text-sm text-ink-soft">
          <span className="inline-block h-[22px] w-[22px] animate-spin rounded-full border-[3px] border-surface-border border-t-accent" aria-hidden="true" />
          <span>Cargando expedientes...</span>
        </div>
      </div>
    );
  }

  if (!expedientes || expedientes.length === 0) {
    return (
      <div className="rounded border border-surface-border bg-surface-panel py-[60px] text-center text-ink-soft">
        <div className="mb-1.5 text-[15px] font-semibold text-ink-medium">No se encontraron expedientes</div>
        <div className="text-[13px] text-ink-faint">Ajustá los filtros de búsqueda para ver resultados</div>
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
      <div className="overflow-x-auto rounded border border-surface-border bg-surface-panel">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.key} className="whitespace-nowrap border-b-2 border-surface-border bg-surface-panel px-3.5 py-2.5 text-left text-xs font-bold text-ink-medium select-none">
                  {col.label}
                </th>
              ))}
              <th className="w-[90px] border-b-2 border-surface-border bg-surface-panel px-3.5 py-2.5" aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((row, i) => (
              <tr key={row.id} className={i % 2 === 1 ? 'bg-surface-bg' : ''}>
                {columnas.map((col) => (
                  <td key={col.key} className="whitespace-nowrap border-b border-surface-border px-3.5 py-[13px] text-[13px] text-ink-medium">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
                <td className="whitespace-nowrap border-b border-surface-border px-3.5 py-[13px] text-[13px] text-ink-medium">
                  <button
                    type="button"
                    onClick={() => navigate(`/expediente/${row.id}`)}
                    className="whitespace-nowrap border-none bg-transparent p-0 font-medium text-accent hover:underline"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5">
        <span className="text-[13px] text-ink-soft">
          Mostrando {inicio + 1}–{Math.min(inicio + FILAS_POR_PAGINA, expedientes.length)} de{' '}
          <strong className="text-ink-medium">{expedientes.length.toLocaleString('es-AR')}</strong> trámites
        </span>

        {totalPaginas > 1 && (
          <div className="flex items-center gap-0.5">
            <PagBtn disabled={paginaSegura === 1} onClick={() => onPaginaChange(paginaSegura - 1)}>
              &lsaquo; Anterior
            </PagBtn>
            {paginasVisibles.map((n, i) =>
              n === '...' ? (
                <span key={`dots-${i}`} className="px-2 py-1.5 text-[13px] text-ink-faint">
                  …
                </span>
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
