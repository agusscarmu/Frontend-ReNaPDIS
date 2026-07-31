import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { KPI_ESTADOS, ESTADO_CONFIG } from '@/constants/estados';
import type { Metricas } from '@/types/expediente.types';

interface GraficoEstadosProps {
  metricas: Metricas | null | undefined;
}

export default function GraficoEstados({ metricas }: GraficoEstadosProps) {
  const data = KPI_ESTADOS.map((e) => ({
    name: ESTADO_CONFIG[e].label,
    value: metricas?.[e] ?? 0,
    color: ESTADO_CONFIG[e].color,
  })).filter((d) => d.value > 0);

  if (!data.length) return null;

  return (
    <div className="rounded border border-surface-border bg-surface-panel px-5 py-4 shadow-sm">
      <div className="mb-2 text-[13px] font-bold text-ink-medium">Distribución por estado</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
