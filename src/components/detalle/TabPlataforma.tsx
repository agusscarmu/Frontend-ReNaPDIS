import type { ReactNode } from 'react';
import { TIPOS } from '@/constants/dominio';
import type { Expediente } from '@/types/expediente.types';

interface TabPlataformaProps {
  expediente: Expediente;
}

function IcoCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#DCFCE7" />
      <path d="M7 12l3.5 3.5L17 8" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoCross() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#FEE2E2" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IcoDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IcoExternal() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function CardSection({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mb-4 overflow-hidden rounded border border-surface-border bg-surface-panel">
      <div className="border-b border-surface-borderSoft bg-neutral-50 px-4 py-3">
        <span className="text-sm font-bold text-ink-strong">{titulo}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function CampoGrid({ label, value, esLink, colspan }: { label: string; value?: string; esLink?: boolean; colspan?: boolean }) {
  return (
    <div className={['border-b border-surface-borderSoft px-4 py-3', colspan ? 'col-span-2' : ''].join(' ')}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      {esLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[13px] text-accent no-underline">
          {value}
          <span className="ml-1 inline-block align-middle">
            <IcoExternal />
          </span>
        </a>
      ) : (
        <div className="text-[13px] font-medium text-ink-strong">{value || '—'}</div>
      )}
    </div>
  );
}

function ConsumeRefeps({ valor }: { valor: boolean }) {
  return (
    <div className="border-b border-surface-borderSoft px-4 py-3">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Consume REFEPS</div>
      {valor ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Sí
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-borderSoft px-2.5 py-0.5 text-xs font-bold text-ink-soft">
          No
        </span>
      )}
    </div>
  );
}

export default function TabPlataforma({ expediente }: TabPlataformaProps) {
  const esRepositorio = expediente.tipo === TIPOS.REPOSITORIO;
  const djs = expediente.declaracionesJuradas || [];

  const docs = [
    ...(esRepositorio
      ? []
      : [
          { titulo: 'Modelo de Receta Digital', disponible: !!expediente.imagenReceta },
          { titulo: 'Pantalla de Prescripción', disponible: !!expediente.imagenPantallaPrescripcion },
        ]),
    { titulo: 'Constancia de Personería', disponible: !!expediente.acreditaPersoneria },
    { titulo: 'Certificado de Inscripción de Bases de Datos', disponible: !!expediente.certificadoInscripcionBD },
    { titulo: 'Registro de Bases de Datos', disponible: !!expediente.inscripcionBD },
  ];

  return (
    <div className="grid grid-cols-[3fr_2fr] items-start gap-6">
      <div>
        <CardSection titulo="Datos de la plataforma">
          <div className="grid grid-cols-2">
            <CampoGrid label="Tipo de Sistema" value={expediente.tipo} />
            <CampoGrid label="Software" value={expediente.nombreSoftware} />
            <CampoGrid label="Versión" value={expediente.versionProduccion} />
            <CampoGrid label="Modalidad de uso" value={expediente.modalidadPrescripcion} />
            <ConsumeRefeps valor={expediente.consumeREFEPS} />
            <CampoGrid label="Estándar de Intercambio" value={expediente.estandarInteroperabilidad} />
            <CampoGrid label="URL del Servicio" value={expediente.urlSitio} esLink colspan />
          </div>
        </CardSection>

        <CardSection titulo="Declaraciones juradas">
          {djs.map((dj) => (
            <div key={dj.clave} className="flex items-start gap-3 border-b border-surface-borderSoft px-4 py-3.5">
              <div className="mt-0.5 shrink-0">{dj.valor ? <IcoCheck /> : <IcoCross />}</div>
              <div className="text-[13px] font-semibold text-ink-strong">{dj.texto}</div>
            </div>
          ))}
        </CardSection>
      </div>

      <div>
        <div className="mb-4 overflow-hidden rounded border border-surface-border bg-surface-panel">
          <div className="border-b border-surface-borderSoft bg-neutral-50 px-4 py-3">
            <span className="text-sm font-bold text-ink-strong">Evidencia documental</span>
          </div>
          {docs.map((doc) => (
            <div
              key={doc.titulo}
              className={['flex items-center gap-3 border-b border-surface-borderSoft px-3.5 py-3', doc.disponible ? '' : 'opacity-45'].join(' ')}
            >
              <IcoDoc />
              <span className="flex-1 text-[13px] text-ink-medium">{doc.titulo}</span>
              {doc.disponible ? (
                <button type="button" title="No disponible en Etapa 1" disabled className="flex cursor-not-allowed items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-accent">
                  Ver PDF <IcoExternal />
                </button>
              ) : (
                <span className="text-[11px] text-ink-faint">No adjunto</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
