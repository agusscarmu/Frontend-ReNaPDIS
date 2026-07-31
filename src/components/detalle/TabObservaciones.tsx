import type { Expediente } from '@/types/expediente.types';

interface TabObservacionesProps {
  expediente: Expediente;
}

export default function TabObservaciones({ expediente }: TabObservacionesProps) {
  const obs = expediente.observaciones;

  return (
    <div>
      <h2 className="mb-2.5 text-base font-bold text-ink-strong">Observaciones</h2>
      <hr className="mb-5 border-t border-surface-border" />

      {obs ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-ink-medium">{obs}</div>
      ) : (
        <div className="py-10 text-center text-sm text-ink-faint">Sin observaciones registradas.</div>
      )}
    </div>
  );
}
