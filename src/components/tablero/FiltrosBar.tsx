import type { ChangeEvent } from 'react';
import { ESTADOS_LIST } from '@/constants/estados';
import { PROVINCIAS } from '@/constants/provincias';
import { TIPOS_LIST, NATURALEZA_ENTIDAD } from '@/constants/dominio';
import type { FiltrosExpedientes } from '@/types/expediente.types';

interface FiltrosBarProps {
  filtros: FiltrosExpedientes;
  onChange: (filtros: FiltrosExpedientes) => void;
  onLimpiar: () => void;
  responsables: string[];
}

function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const selectClass =
  'w-full appearance-none rounded-sm border border-gray-300 bg-white bg-[right_10px_center] bg-no-repeat py-2 pl-2.5 pr-[30px] text-[13px] text-ink-strong outline-none cursor-pointer';
const selectArrow = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
};

export default function FiltrosBar({ filtros, onChange, onLimpiar, responsables }: FiltrosBarProps) {
  const handleChange = (campo: keyof FiltrosExpedientes) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filtros, [campo]: e.target.value });

  return (
    <div className="rounded border border-surface-border bg-surface-panel px-5 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-[2_1_200px]">
          <span className="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center">
            <IcoSearch />
          </span>
          <input
            type="text"
            placeholder="Buscar por expediente, entidad o CUIT..."
            value={filtros.busqueda ?? ''}
            onChange={handleChange('busqueda')}
            className="w-full rounded-sm border border-gray-300 bg-white py-2 pl-[34px] pr-2.5 text-[13px] text-ink-strong outline-none"
            aria-label="Buscar"
          />
        </div>

        <div className="flex-[1_1_130px]">
          <select value={filtros.estado ?? ''} onChange={handleChange('estado')} className={selectClass} style={selectArrow} aria-label="Estado">
            <option value="">Estado (Todos)</option>
            {ESTADOS_LIST.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-[1_1_130px]">
          <select value={filtros.provincia ?? ''} onChange={handleChange('provincia')} className={selectClass} style={selectArrow} aria-label="Provincia">
            <option value="">Provincia</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-[1_1_130px]">
          <select value={filtros.responsable ?? ''} onChange={handleChange('responsable')} className={selectClass} style={selectArrow} aria-label="Responsable">
            <option value="">Responsable</option>
            {(responsables ?? []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-[1_1_130px]">
          <select value={filtros.tipo ?? ''} onChange={handleChange('tipo')} className={selectClass} style={selectArrow} aria-label="Tipo">
            <option value="">Tipo (Todos)</option>
            {TIPOS_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-[1_1_130px]">
          <select
            value={filtros.naturalezaEntidad ?? ''}
            onChange={handleChange('naturalezaEntidad')}
            className={selectClass}
            style={selectArrow}
            aria-label="Naturaleza"
          >
            <option value="">Naturaleza (Todas)</option>
            <option value={NATURALEZA_ENTIDAD.PUBLICA}>Pública</option>
            <option value={NATURALEZA_ENTIDAD.PRIVADA}>Privada</option>
          </select>
        </div>

        <div className="flex flex-[2_1_220px] items-center gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[11px] text-ink-faint">Modificado desde</span>
            <input
              type="date"
              value={filtros.ultimaModificacionDesde ?? ''}
              onChange={handleChange('ultimaModificacionDesde')}
              className="w-full rounded-sm border border-gray-300 bg-white px-2.5 py-[7px] text-[13px] text-ink-strong outline-none"
              aria-label="Modificado desde"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-[11px] text-ink-faint">Modificado hasta</span>
            <input
              type="date"
              value={filtros.ultimaModificacionHasta ?? ''}
              onChange={handleChange('ultimaModificacionHasta')}
              className="w-full rounded-sm border border-gray-300 bg-white px-2.5 py-[7px] text-[13px] text-ink-strong outline-none"
              aria-label="Modificado hasta"
            />
          </label>
        </div>

        <div className="flex-[1_1_170px]">
          <select value={filtros.orden ?? ''} onChange={handleChange('orden')} className={selectClass} style={selectArrow} aria-label="Ordenar por">
            <option value="">Ordenar por</option>
            <option value="recientes">Más recientes primero</option>
            <option value="antiguos">Más antiguos primero</option>
          </select>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button type="button" onClick={onLimpiar} className="whitespace-nowrap border-none bg-transparent px-1 py-2 text-[13px] font-medium text-accent">
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
