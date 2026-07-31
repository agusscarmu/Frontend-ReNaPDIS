import { useState, useRef, useEffect } from 'react';
import type { ColumnaTabla } from '@/types/expediente.types';

interface SelectorColumnasProps {
  columnas: ColumnaTabla[];
  visibles: ColumnaTabla['key'][];
  onToggle: (key: ColumnaTabla['key']) => void;
  onReset: () => void;
}

function IcoColumnas() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

export default function SelectorColumnas({ columnas, visibles, onToggle, onReset }: SelectorColumnasProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const onClickFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', onClickFuera);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickFuera);
      document.removeEventListener('keydown', onEsc);
    };
  }, [abierto]);

  const visiblesSet = new Set(visibles);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm border border-surface-border bg-surface-panel px-3.5 py-2.5 text-[13px] font-medium text-ink-medium hover:border-accent hover:text-ink-strong"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        <IcoColumnas />
        Columnas
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
          {visibles.length}
        </span>
      </button>

      {abierto && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[100] w-60 overflow-hidden rounded border border-surface-border bg-surface-panel shadow-[0_8px_24px_rgba(0,0,0,0.12)]" role="menu">
          <div className="flex items-center justify-between border-b border-surface-borderSoft px-3.5 py-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.03em] text-ink-strong">Columnas visibles</span>
            <button type="button" className="text-xs font-semibold text-accent hover:underline" onClick={onReset}>
              Restablecer
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {columnas.map((col) => (
              <label key={col.key} className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] text-ink-medium hover:bg-surface-bg">
                <input
                  type="checkbox"
                  checked={visiblesSet.has(col.key)}
                  onChange={() => onToggle(col.key)}
                  className="h-[15px] w-[15px] shrink-0 cursor-pointer accent-accent"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
