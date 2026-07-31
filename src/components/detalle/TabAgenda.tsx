import type { ReactNode } from 'react';
import CampoLectura from '@/components/primitives/CampoLectura';
import EstadoBadge from '@/components/primitives/EstadoBadge';
import { formatFecha } from '@/components/tablero/columnas.config';
import type { Expediente } from '@/types/expediente.types';

interface TabAgendaProps {
  expediente: Expediente;
}

function IcoBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function IcoPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IcoDoc() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IcoLock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function SeccionCard({ icon, titulo, children }: { icon: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div className="mb-4 overflow-hidden rounded border border-surface-border bg-surface-panel">
      <div className="flex items-center gap-2 border-b border-surface-borderSoft bg-neutral-50 px-4 py-3">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-medium">{titulo}</span>
      </div>
      <div className="grid grid-cols-2">{children}</div>
    </div>
  );
}

function Fila({ full, children }: { full?: boolean; children: ReactNode }) {
  return <div className={['border-b border-surface-borderSoft px-4 py-[11px]', full ? 'col-span-2' : ''].join(' ')}>{children}</div>;
}

export default function TabAgenda({ expediente }: TabAgendaProps) {
  return (
    <div>
      <div className="grid grid-cols-[3fr_2fr] items-start gap-6">
        <div>
          <SeccionCard icon={<IcoBuilding />} titulo="Entidad">
            <Fila full>
              <CampoLectura label="Nombre" valor={expediente.nombreEntidad} />
            </Fila>
            <Fila>
              <CampoLectura label="CUIT" valor={expediente.cuitEntidad} />
            </Fila>
            <Fila>
              <CampoLectura label="Naturaleza" valor={expediente.naturalezaEntidad} />
            </Fila>
            <Fila>
              <CampoLectura label="Provincia" valor={expediente.provincia} />
            </Fila>
            <Fila>
              <CampoLectura label="Departamento" valor={expediente.departamento} />
            </Fila>
          </SeccionCard>

          <SeccionCard icon={<IcoPerson />} titulo="Contacto">
            <Fila full>
              <CampoLectura label="Contacto" valor={expediente.contacto} />
            </Fila>
            <Fila>
              <CampoLectura label="Función en la entidad" valor={expediente.funcionEnEntidad} />
            </Fila>
            <Fila>
              <CampoLectura label="CUIT/CUIL" valor={expediente.cuitCuilContacto} />
            </Fila>
            <Fila>
              <CampoLectura label="Teléfono" valor={expediente.telefono} />
            </Fila>
            <Fila>
              <CampoLectura label="Email" valor={expediente.email} />
            </Fila>
            <Fila>
              <CampoLectura label="Referente técnico" valor={expediente.referenteTecnico} />
            </Fila>
            <Fila>
              <CampoLectura label="Referente es solicitante" valor={expediente.referenteEsSolicitante ? 'Sí' : 'No'} />
            </Fila>
          </SeccionCard>
        </div>

        <div>
          <SeccionCard icon={<IcoDoc />} titulo="Gestión interna">
            <Fila full>
              <CampoLectura label="Responsable" valor={expediente.responsable} />
            </Fila>
            <Fila full>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Estado actual</div>
              <div className="flex">
                <EstadoBadge estado={expediente.estado} />
              </div>
            </Fila>
            <div className="col-span-2 px-4 py-3">
              <button type="button" title="No disponible en Etapa 1" className="w-full cursor-not-allowed rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-medium opacity-75">
                Ver bitácora de cambios
              </button>
            </div>
          </SeccionCard>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-surface-border pt-4 text-[11px] text-ink-faint">
        <div className="flex items-center gap-1.5">
          <IcoLock />
          <span>Datos de gestión interna</span>
        </div>
        <span>Última actualización: {formatFecha(expediente.ultimaModificacion)}</span>
      </div>
    </div>
  );
}
