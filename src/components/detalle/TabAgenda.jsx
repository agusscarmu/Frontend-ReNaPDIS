import CampoLectura from '@/components/ui/CampoLectura.jsx';
import EstadoBadge from '@/components/ui/EstadoBadge.jsx';
import { formatFecha } from '@/config/columnas.jsx';
import styles from './TabAgenda.module.css';

function IcoBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function IcoPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
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

function SeccionCard({ icon, titulo, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        {icon}
        <span className={styles.cardTitulo}>{titulo}</span>
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}

function Fila({ full, children }) {
  return <div className={[styles.fila, full ? styles.filaFull : ''].join(' ').trim()}>{children}</div>;
}

export default function TabAgenda({ expediente }) {
  return (
    <div>
      <div className={styles.layout}>

        {/* Columna izquierda */}
        <div>
          <SeccionCard icon={<IcoBuilding />} titulo="Entidad">
            <Fila full><CampoLectura label="Nombre" valor={expediente.nombreEntidad} /></Fila>
            <Fila><CampoLectura label="CUIT" valor={expediente.cuitEntidad} /></Fila>
            <Fila><CampoLectura label="Naturaleza" valor={expediente.naturalezaEntidad} /></Fila>
            <Fila><CampoLectura label="Provincia" valor={expediente.provincia} /></Fila>
            <Fila><CampoLectura label="Departamento" valor={expediente.departamento} /></Fila>
          </SeccionCard>

          <SeccionCard icon={<IcoPerson />} titulo="Contacto">
            <Fila full><CampoLectura label="Contacto" valor={expediente.contacto} /></Fila>
            <Fila><CampoLectura label="Función en la entidad" valor={expediente.funcionEnEntidad} /></Fila>
            <Fila><CampoLectura label="CUIT/CUIL" valor={expediente.cuitCuilContacto} /></Fila>
            <Fila><CampoLectura label="Teléfono" valor={expediente.telefono} /></Fila>
            <Fila><CampoLectura label="Email" valor={expediente.email} /></Fila>
            <Fila><CampoLectura label="Referente técnico" valor={expediente.referenteTecnico} /></Fila>
            <Fila>
              <CampoLectura
                label="Referente es solicitante"
                valor={expediente.referenteEsSolicitante ? 'Sí' : 'No'}
              />
            </Fila>
          </SeccionCard>
        </div>

        {/* Columna derecha */}
        <div>
          <SeccionCard icon={<IcoDoc />} titulo="Gestión interna">
            <Fila full><CampoLectura label="Responsable" valor={expediente.responsable} /></Fila>
            <Fila full>
              <div className={styles.label}>Estado actual</div>
              <div className={styles.estadoWrap}><EstadoBadge estado={expediente.estado} /></div>
            </Fila>
            <div className={styles.botonWrap}>
              <button type="button" title="No disponible en Etapa 1" className={styles.btnDisabled}>
                Ver bitácora de cambios
              </button>
            </div>
          </SeccionCard>
        </div>
      </div>

      {/* Footer institucional */}
      <div className={styles.auditFooter}>
        <div className={styles.auditLeft}>
          <IcoLock />
          <span>Datos de gestión interna</span>
        </div>
        <span>
          Última actualización: {formatFecha(expediente.ultimaModificacion)}
        </span>
      </div>
    </div>
  );
}
