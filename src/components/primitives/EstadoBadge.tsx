import { ESTADO_CONFIG } from '@/constants/estados';
import type { Estado } from '@/types/expediente.types';

interface EstadoBadgeProps {
  estado: Estado | string | undefined;
}

export default function EstadoBadge({ estado }: EstadoBadgeProps) {
  const cfg = estado ? ESTADO_CONFIG[estado as Estado] : undefined;
  if (!cfg) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-surface-border px-2.5 py-0.5 text-xs font-semibold">
        {estado || '—'}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <span aria-hidden="true">{cfg.icono}</span>
      {cfg.label}
    </span>
  );
}
