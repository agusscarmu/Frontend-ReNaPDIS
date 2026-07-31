import { ESTADO_CONFIG } from '@/constants/estados';
import { tokens } from '@/design-tokens/tokens';
import type { Estado } from '@/types/expediente.types';

interface KpiCardProps {
  estado?: Estado;
  isTotal?: boolean;
  count?: number;
  activo?: boolean;
  onClick?: () => void;
  showDivider?: boolean;
}

export default function KpiCard({ estado, isTotal = false, count, activo, onClick, showDivider = false }: KpiCardProps) {
  const config = estado ? ESTADO_CONFIG[estado] : null;
  const numColor = isTotal ? tokens.colors.textStrong : config?.color ?? tokens.colors.textMedium;
  const cargando = typeof count !== 'number';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={[
        'relative min-w-[80px] flex-1 border-none bg-transparent px-6 pb-3.5 pt-4 text-left transition-colors',
        showDivider ? 'border-l border-surface-border' : '',
        activo ? 'bg-neutral-50' : '',
      ].join(' ')}
    >
      {activo && <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-sm" style={{ background: numColor }} />}
      <div className="mb-1 text-[28px] font-bold leading-[1.1]" style={{ color: numColor }}>
        {cargando ? <span className="inline-block h-6 w-10 rounded bg-surface-borderSoft align-middle" /> : count.toLocaleString('es-AR')}
      </div>
      <div className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.8px] text-ink-faint">
        {isTotal ? 'Total' : config?.label ?? estado}
      </div>
    </button>
  );
}
