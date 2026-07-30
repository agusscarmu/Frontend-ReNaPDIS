import { ESTADO_CONFIG } from '@/domain/estados.js';
import styles from './KpiCard.module.css';

export default function KpiCard({ estado, isTotal = false, count, activo, onClick, showDivider = false }) {
  const config = estado ? ESTADO_CONFIG[estado] : null;
  const numColor = isTotal ? 'var(--text-strong)' : (config?.color ?? 'var(--text-medium)');
  const cargando = typeof count !== 'number';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={[styles.card, activo ? styles.activo : '', showDivider ? styles.divider : ''].join(' ').trim()}
    >
      {activo && <span className={styles.indicador} style={{ background: numColor }} />}
      <div className={styles.numero} style={{ color: numColor }}>
        {cargando ? <span className={styles.skeleton} /> : count.toLocaleString('es-AR')}
      </div>
      <div className={styles.label}>{isTotal ? 'Total' : (config?.label ?? estado)}</div>
    </button>
  );
}
