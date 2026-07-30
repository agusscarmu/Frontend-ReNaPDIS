import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout.jsx';
import Breadcrumb from '@/components/layout/Breadcrumb.jsx';
import EstadoBadge from '@/components/ui/EstadoBadge.jsx';
import TabAgenda from '@/components/detalle/TabAgenda.jsx';
import TabPlataforma from '@/components/detalle/TabPlataforma.jsx';
import TabHistorial from '@/components/detalle/TabHistorial.jsx';
import TabObservaciones from '@/components/detalle/TabObservaciones.jsx';
import { obtenerExpediente } from '@/services/expedientes.service.js';
import { TEXTOS } from '@/config/constantes.js';
import styles from './DetalleExpediente.module.css';

function formatFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function IcoPrint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}

function IcoShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

function IcoInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

const TABS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'historial', label: 'Historial' },
  { id: 'observaciones', label: 'Observaciones' },
];

export default function DetalleExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActiva, setTabActiva] = useState('agenda');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setExpediente(null);
    obtenerExpediente(id)
      .then(setExpediente)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <div className={styles.loadingLabel}>Cargando expediente…</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !expediente) {
    return (
      <Layout>
        <div className={styles.notFoundWrap}>
          <div className={styles.notFoundTitulo}>Expediente no encontrado</div>
          <button className={styles.volverBtn} onClick={() => navigate('/')}>
            ← Volver a Trámites
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumb items={[{ label: 'Trámites', to: '/' }, { label: expediente.expediente }]} />

      {/* Encabezado */}
      <div className={styles.encabezado}>
        <div>
          <div className={styles.tituloRow}>
            <h1 className={styles.numeroExpediente}>{expediente.expediente}</h1>
            <EstadoBadge estado={expediente.estado} />
          </div>
          <div className={styles.subtitulo}>
            {expediente.nombreEntidad} — {expediente.tipo}
          </div>
          <div className={styles.metaLinea}>
            Responsable: <strong>{expediente.responsable}</strong>
            {' · '}
            Ingresado: {formatFecha(expediente.fechaIngreso)}
          </div>
        </div>

        <div className={styles.acciones}>
          <button className={styles.btnAccion} title="No disponible en Etapa 1" disabled>
            <IcoPrint /> Imprimir
          </button>
          <button className={styles.btnAccionPrimario} title="No disponible en Etapa 1" disabled>
            <IcoShare /> Pase de Expediente
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <div className={styles.tabsRow}>
          {TABS.map(({ id: tabId, label }) => {
            const activa = tabActiva === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setTabActiva(tabId)}
                className={activa ? styles.tabBtnActiva : styles.tabBtn}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner solo lectura */}
      <div className={styles.banner}>
        <IcoInfo />
        <div>
          <div className={styles.bannerTitulo}>{TEXTOS.bannerSoloLecturaTitulo}</div>
          <div className={styles.bannerDetalle}>{TEXTOS.bannerSoloLecturaDetalle}</div>
        </div>
      </div>

      {/* Contenido de tab */}
      {tabActiva === 'agenda' && <TabAgenda expediente={expediente} />}
      {tabActiva === 'plataforma' && <TabPlataforma expediente={expediente} />}
      {tabActiva === 'historial' && <TabHistorial historial={expediente.historial} />}
      {tabActiva === 'observaciones' && <TabObservaciones expediente={expediente} />}
    </Layout>
  );
}
