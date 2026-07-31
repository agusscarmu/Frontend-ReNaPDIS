import { KPI_ESTADOS } from '@/constants/estados';
import KpiCard from './KpiCard';
import type { Estado, Metricas } from '@/types/expediente.types';

interface KpiBarProps {
  metricas: Metricas | null | undefined;
  loading: boolean;
  filtroEstado?: Estado | '';
  onFiltroEstado: (estado: Estado) => void;
  onLimpiar: () => void;
}

export default function KpiBar({ metricas, loading, filtroEstado, onFiltroEstado, onLimpiar }: KpiBarProps) {
  const handleClick = (estado: Estado) => () => {
    if (estado === filtroEstado) {
      onLimpiar();
    } else {
      onFiltroEstado(estado);
    }
  };

  return (
    <div className="flex flex-wrap items-stretch rounded border border-surface-border bg-surface-panel shadow-sm">
      <KpiCard isTotal count={loading ? undefined : metricas?.total} activo={!filtroEstado} onClick={onLimpiar} />
      {KPI_ESTADOS.map((estado) => (
        <KpiCard
          key={estado}
          estado={estado}
          count={loading ? undefined : metricas?.[estado] ?? 0}
          activo={filtroEstado === estado}
          onClick={handleClick(estado)}
          showDivider
        />
      ))}
    </div>
  );
}
