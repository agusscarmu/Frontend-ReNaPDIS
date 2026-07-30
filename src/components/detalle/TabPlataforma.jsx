import { TIPOS } from '@/domain/tipos.js';
import styles from './TabPlataforma.module.css';

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
function CardSection({ titulo, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitulo}>{titulo}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function CampoGrid({ label, value, esLink, colspan }) {
  return (
    <div className={[styles.campo, colspan ? styles.campoFull : ''].join(' ').trim()}>
      <div className={styles.campoLabel}>{label}</div>
      {esLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className={styles.campoLink}>
          {value}
          <span className={styles.campoLinkIcon}><IcoExternal /></span>
        </a>
      ) : (
        <div className={styles.campoValor}>{value || '—'}</div>
      )}
    </div>
  );
}

function ConsumeRefeps({ valor }) {
  return (
    <div className={styles.campo}>
      <div className={styles.campoLabel}>Consume REFEPS</div>
      {valor ? (
        <span className={[styles.pill, styles.pillSi].join(' ')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
          </svg>
          Sí
        </span>
      ) : (
        <span className={[styles.pill, styles.pillNo].join(' ')}>No</span>
      )}
    </div>
  );
}

export default function TabPlataforma({ expediente }) {
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
    <div className={styles.layout}>

      {/* Columna izquierda */}
      <div>
        <CardSection titulo="Datos de la plataforma">
          <div className={styles.campoGrid}>
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
            <div key={dj.clave} className={styles.djFila}>
              <div className={styles.djIcono}>{dj.valor ? <IcoCheck /> : <IcoCross />}</div>
              <div className={styles.djTexto}>{dj.texto}</div>
            </div>
          ))}
        </CardSection>
      </div>

      {/* Columna derecha */}
      <div>
        {/* Evidencia documental */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitulo}>Evidencia documental</span>
          </div>
          {docs.map((doc) => (
            <div
              key={doc.titulo}
              className={[styles.docFila, doc.disponible ? '' : styles.docFilaVacia].join(' ').trim()}
            >
              <IcoDoc />
              <span className={styles.docTitulo}>{doc.titulo}</span>
              {doc.disponible ? (
                <button type="button" title="No disponible en Etapa 1" disabled className={styles.btnVerPdf}>
                  Ver PDF <IcoExternal />
                </button>
              ) : (
                <span className={styles.docNoAdjunto}>No adjunto</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
