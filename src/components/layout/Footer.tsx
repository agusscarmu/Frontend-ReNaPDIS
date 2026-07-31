import { TEXTOS } from '@/constants/textos';

export default function Footer() {
  return (
    <footer className="mt-12 border-t-2 border-surface-border bg-surface-panel px-6 pb-6 pt-7 text-center">
      <div className="mx-auto mb-4 h-0.5 w-10 rounded-sm bg-accent" />
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[2px] text-ink-medium">{TEXTOS.appNombre}</div>
      <div className="text-xs text-ink-faint">Etapa 1 — Prototipo (solo lectura)</div>
    </footer>
  );
}
