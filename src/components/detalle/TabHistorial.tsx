import EstadoBadge from '@/components/primitives/EstadoBadge';
import type { MovimientoHistorial, TipoMovimiento } from '@/types/expediente.types';

interface TabHistorialProps {
  historial?: MovimientoHistorial[];
}

const DOT_COLOR: Record<TipoMovimiento, string> = {
  Ingreso: '#9CA3AF',
  Subsanación: '#3B82F6',
  Reingreso: '#3B82F6',
  'Envío de correo': '#F59E0B',
  'Habilitación de subsanación': '#F59E0B',
  'Número de resolución': '#10B981',
  'Guarda temporal': '#6B7280',
};

const TIPO_LABEL: Record<TipoMovimiento, string> = {
  Ingreso: 'Ingreso',
  Reingreso: 'Reingreso',
  'Envío de correo': 'Envío de correo',
  'Habilitación de subsanación': 'Habilitación de subsanación',
  'Número de resolución': 'N° de resolución',
  'Guarda temporal': 'Guarda temporal',
  Subsanación: 'Subsanación',
};

function formatFechaCorta(iso: string | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function TipoBadge({ tipo }: { tipo: TipoMovimiento }) {
  const color = DOT_COLOR[tipo] ?? '#6B7280';
  return (
    <span
      className="whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `${color}18`, color, borderColor: `${color}40` }}
    >
      {TIPO_LABEL[tipo] ?? tipo}
    </span>
  );
}

function IcoArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-1 align-middle">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function TabHistorial({ historial = [] }: TabHistorialProps) {
  if (!historial.length) {
    return (
      <div className="py-[60px] text-center text-ink-soft">
        <div className="text-sm font-semibold">Sin movimientos registrados</div>
      </div>
    );
  }

  const ordenado = [...historial].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-1 text-lg font-bold text-ink-strong">Historial de movimientos</h2>
        <p className="text-[13px] text-ink-soft">
          Trazabilidad completa del expediente desde su ingreso inicial al sistema hasta su estado actual.
        </p>
      </div>

      <div className="relative pl-7">
        <div className="absolute bottom-3.5 left-[7px] top-3.5 w-0.5 rounded-sm bg-surface-border" />

        {ordenado.map((mov, idx) => {
          const color = DOT_COLOR[mov.tipoMovimiento] ?? '#9CA3AF';
          return (
            <div key={idx} className="relative mb-4">
              <div
                className="absolute -left-7 top-4 z-[1] h-4 w-4 rounded-full border-2 border-white"
                style={{ background: color, boxShadow: `0 0 0 2px ${color}40` }}
              />

              <div className="overflow-hidden rounded border border-surface-border bg-surface-panel">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-borderSoft px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <TipoBadge tipo={mov.tipoMovimiento} />
                    {mov.estadoEnEseMomento && <EstadoBadge estado={mov.estadoEnEseMomento} />}
                    {mov.numeroResolucion && (
                      <span className="whitespace-nowrap rounded-sm border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        N° {mov.numeroResolucion}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-faint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatFechaCorta(mov.fecha)}
                  </div>
                </div>

                <div className="px-4 py-3">
                  {(mov.usuarioOrigen || mov.usuarioDestino) && (
                    <div className={['text-[13px] text-ink-medium', mov.motivoPase ? 'mb-2.5' : ''].join(' ')}>
                      {mov.usuarioOrigen && (
                        <span>
                          <span className="mr-1 text-[11px] font-bold text-ink-faint">De:</span>
                          <span className="font-semibold text-accent">{mov.sectorOrigen || mov.usuarioOrigen}</span>
                        </span>
                      )}
                      {mov.usuarioOrigen && mov.usuarioDestino && (
                        <span className="text-ink-faint">
                          <IcoArrow />
                        </span>
                      )}
                      {mov.usuarioDestino && (
                        <span>
                          <span className="mr-1 text-[11px] font-bold text-ink-faint">A:</span>
                          <span className="font-semibold text-accent">{mov.usuarioDestino}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {mov.motivoPase && (
                    <p className="m-0 text-[13px] italic leading-relaxed text-gray-600">
                      {mov.tipoMovimiento === 'Envío de correo' ? `Motivo: "${mov.motivoPase}"` : mov.motivoPase}
                    </p>
                  )}

                  {!mov.usuarioOrigen && !mov.usuarioDestino && !mov.motivoPase && (
                    <p className="m-0 text-[13px] text-ink-soft">
                      {mov.tipoMovimiento === 'Ingreso' && 'Apertura del expediente electrónico en plataforma TAD.'}
                      {mov.tipoMovimiento === 'Habilitación de subsanación' && 'El sistema habilitó el módulo de carga para el solicitante.'}
                      {mov.tipoMovimiento === 'Guarda temporal' && 'Expediente derivado a guarda temporal por vencimiento de plazos.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
