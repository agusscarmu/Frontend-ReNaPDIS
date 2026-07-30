import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { KPI_ESTADOS, ESTADO_CONFIG } from '@/domain/estados.js';
import styles from './GraficoEstados.module.css';

export default function GraficoEstados({ metricas }) {
  const data = KPI_ESTADOS
    .map((e) => ({ name: ESTADO_CONFIG[e].label, value: metricas?.[e] ?? 0, color: ESTADO_CONFIG[e].color }))
    .filter((d) => d.value > 0);
  if (!data.length) return null;
  return (
    <div className={styles.card}>
      <div className={styles.titulo}>Distribución por estado</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
