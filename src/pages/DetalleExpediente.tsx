import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import EstadoBadge from '@/components/primitives/EstadoBadge';
import TabAgenda from '@/components/detalle/TabAgenda';
import TabPlataforma from '@/components/detalle/TabPlataforma';
import TabHistorial from '@/components/detalle/TabHistorial';
import TabObservaciones from '@/components/detalle/TabObservaciones';
import { useExpediente } from '@/hooks/useExpediente';
import { TEXTOS } from '@/constants/textos';

function formatFecha(iso: string | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function IcoPrint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IcoShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IcoInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const TABS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'historial', label: 'Historial' },
  { id: 'observaciones', label: 'Observaciones' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DetalleExpediente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState<TabId>('agenda');
  const { data: expediente, isLoading, isError } = useExpediente(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-80 items-center justify-center">
          <div className="text-center text-ink-faint">
            <div className="mx-auto mb-3.5 h-8 w-8 animate-spin rounded-full border-2 border-surface-border border-t-brand" />
            <div className="text-sm">Cargando expediente…</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !expediente) {
    return (
      <Layout>
        <div className="py-20 text-center text-ink-soft">
          <div className="mb-2 text-sm font-semibold">Expediente no encontrado</div>
          <button className="border-none bg-transparent text-sm text-accent" onClick={() => navigate('/')}>
            ← Volver a Trámites
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumb items={[{ label: 'Trámites', to: '/' }, { label: expediente.expediente }]} />

      <div className="mb-1 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-3">
            <h1 className="m-0 font-mono text-2xl font-bold tracking-wide text-ink-strong">{expediente.expediente}</h1>
            <EstadoBadge estado={expediente.estado} />
          </div>
          <div className="mb-1 text-[15px] font-semibold text-ink-medium">
            {expediente.nombreEntidad} — {expediente.tipo}
          </div>
          <div className="text-[13px] text-ink-soft">
            Responsable: <strong className="text-ink-medium">{expediente.responsable}</strong>
            {' · '}
            Ingresado: {formatFecha(expediente.fechaIngreso)}
          </div>
        </div>

        <div className="flex shrink-0 gap-2.5 pt-1">
          <button className="flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-sm border border-gray-300 bg-surface-panel px-4 py-2.5 text-[13px] font-medium text-ink-medium opacity-85" title="No disponible en Etapa 1" disabled>
            <IcoPrint /> Imprimir
          </button>
          <button className="flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-sm border-none bg-brand px-4 py-2.5 text-[13px] font-semibold text-white opacity-85" title="No disponible en Etapa 1" disabled>
            <IcoShare /> Pase de Expediente
          </button>
        </div>
      </div>

      <div className="mt-6 border-b border-surface-border">
        <div className="flex">
          {TABS.map(({ id: tabId, label }) => {
            const activa = tabActiva === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setTabActiva(tabId)}
                className={[
                  '-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-sm transition-colors',
                  activa ? 'border-accent font-semibold text-accent' : 'border-transparent font-normal text-ink-soft hover:text-ink-medium',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="my-7 flex items-start gap-2.5 rounded-r-sm border-l-4 border-blue-500 bg-blue-50 px-4 py-3.5">
        <IcoInfo />
        <div>
          <div className="mb-0.5 text-[13px] font-semibold text-blue-700">{TEXTOS.bannerSoloLecturaTitulo}</div>
          <div className="text-xs text-blue-500">{TEXTOS.bannerSoloLecturaDetalle}</div>
        </div>
      </div>

      {tabActiva === 'agenda' && <TabAgenda expediente={expediente} />}
      {tabActiva === 'plataforma' && <TabPlataforma expediente={expediente} />}
      {tabActiva === 'historial' && <TabHistorial historial={expediente.historial} />}
      {tabActiva === 'observaciones' && <TabObservaciones expediente={expediente} />}
    </Layout>
  );
}
