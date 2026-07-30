import EstadoBadge from '@/components/ui/EstadoBadge.jsx';
import styles from './TabHistorial.module.css';

const DOT_COLOR = {
  Ingreso: '#9CA3AF',
  Subsanación: '#3B82F6',
  Reingreso: '#3B82F6',
  'Envío de correo': '#F59E0B',
  'Habilitación de subsanación': '#F59E0B',
  'Número de resolución': '#10B981',
  'Guarda temporal': '#6B7280',
};

const TIPO_LABEL = {
  Ingreso: 'Ingreso',
  Reingreso: 'Reingreso',
  'Envío de correo': 'Envío de correo',
  'Habilitación de subsanación': 'Habilitación de subsanación',
  'Número de resolución': 'N° de resolución',
  'Guarda temporal': 'Guarda temporal',
  Subsanación: 'Subsanación',
};

function formatFechaCorta(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function TipoBadge({ tipo }) {
  const color = DOT_COLOR[tipo] ?? '#6B7280';
  return (
    <span
      className={styles.tipoBadge}
      style={{ background: `${color}18`, color, borderColor: `${color}40` }}
    >
      {TIPO_LABEL[tipo] ?? tipo}
    </span>
  );
}

function IcoArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icoArrow}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function TabHistorial({ historial = [] }) {
  if (!historial.length) {
    return (
      <div className={styles.vacio}>
        <div className={styles.vacioTitulo}>Sin movimientos registrados</div>
      </div>
    );
  }

  const ordenado = [...historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <div className={styles.encabezado}>
        <h2 className={styles.titulo}>Historial de movimientos</h2>
        <p className={styles.subtitulo}>
          Trazabilidad completa del expediente desde su ingreso inicial al sistema hasta su estado actual.
        </p>
      </div>

      <div className={styles.timeline}>
        <div className={styles.lineaVertical} />

        {ordenado.map((mov, idx) => {
          const color = DOT_COLOR[mov.tipoMovimiento] ?? '#9CA3AF';
          return (
            <div key={idx} className={styles.nodo}>
              <div className={styles.dot} style={{ background: color, boxShadow: `0 0 0 2px ${color}40` }} />

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIzq}>
                    <TipoBadge tipo={mov.tipoMovimiento} />
                    {mov.estadoEnEseMomento && <EstadoBadge estado={mov.estadoEnEseMomento} />}
                    {mov.numeroResolucion && (
                      <span className={styles.resolucionBadge}>N° {mov.numeroResolucion}</span>
                    )}
                  </div>
                  <div className={styles.fecha}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatFechaCorta(mov.fecha)}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {(mov.usuarioOrigen || mov.usuarioDestino) && (
                    <div className={[styles.origenDestino, mov.motivoPase ? styles.conMotivo : ''].join(' ').trim()}>
                      {mov.usuarioOrigen && (
                        <span>
                          <span className={styles.odLabel}>De:</span>
                          <span className={styles.odValor}>{mov.sectorOrigen || mov.usuarioOrigen}</span>
                        </span>
                      )}
                      {mov.usuarioOrigen && mov.usuarioDestino && (
                        <span className={styles.odFlecha}><IcoArrow /></span>
                      )}
                      {mov.usuarioDestino && (
                        <span>
                          <span className={styles.odLabel}>A:</span>
                          <span className={styles.odValor}>{mov.usuarioDestino}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {mov.motivoPase && (
                    <p className={styles.motivo}>
                      {mov.tipoMovimiento === 'Envío de correo' ? `Motivo: "${mov.motivoPase}"` : mov.motivoPase}
                    </p>
                  )}

                  {!mov.usuarioOrigen && !mov.usuarioDestino && !mov.motivoPase && (
                    <p className={styles.motivoDefault}>
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
