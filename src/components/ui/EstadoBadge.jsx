import { ESTADO_CONFIG } from '@/domain/estados.js';
import styles from './EstadoBadge.module.css';

export default function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado];
  if (!cfg) return <span className={styles.badge}>{estado || '—'}</span>;
  return (
    <span
      className={styles.badge}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <span aria-hidden="true">{cfg.icono}</span>
      {cfg.label}
    </span>
  );
}
