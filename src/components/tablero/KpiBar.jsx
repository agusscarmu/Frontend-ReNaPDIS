import { KPI_ESTADOS } from '@/domain/estados.js';
import KpiCard from './KpiCard.jsx';
import styles from './KpiBar.module.css';

export default function KpiBar({ metricas, loading, filtroEstado, onFiltroEstado, onLimpiar }) {
  const handleClick = (estado) => () => {
    if (estado === filtroEstado) {
      onLimpiar?.();
    } else {
      onFiltroEstado?.(estado);
    }
  };

  return (
    <div className={styles.card}>
      <KpiCard
        isTotal
        count={loading ? undefined : metricas?.total}
        activo={!filtroEstado}
        onClick={onLimpiar}
      />
      {KPI_ESTADOS.map((estado) => (
        <KpiCard
          key={estado}
          estado={estado}
          count={loading ? undefined : (metricas?.[estado] ?? 0)}
          activo={filtroEstado === estado}
          onClick={handleClick(estado)}
          showDivider
        />
      ))}
    </div>
  );
}
