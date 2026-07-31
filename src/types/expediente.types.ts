import type { ReactNode } from 'react';

export type Estado =
  | 'Ingresado'
  | 'En análisis'
  | 'A subsanar'
  | 'Reingresado'
  | 'Aprobado'
  | 'Rechazado'
  | 'Publicado'
  | 'Guarda temporal';

export type Tipo = 'Recetario' | 'Repositorio';

export type NaturalezaEntidad = 'Pública' | 'Privada' | 'Obra social';

export type ModalidadPrescripcion = 'Genérico' | 'Comercial' | 'Ambos';

export type EstandarInteroperabilidad = 'ADESFA' | 'HL7 FHIR' | 'JSON no FHIR' | 'Otros';

export type TipoMovimiento =
  | 'Ingreso'
  | 'Subsanación'
  | 'Envío de correo'
  | 'Habilitación de subsanación'
  | 'Reingreso'
  | 'Número de resolución'
  | 'Guarda temporal';

export interface DeclaracionJurada {
  clave: string;
  texto: string;
  valor: boolean;
}

export interface MovimientoHistorial {
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  usuarioOrigen?: string;
  sectorOrigen?: string;
  usuarioDestino?: string;
  sectorDestino?: string;
  motivoPase?: string;
  estadoEnEseMomento?: Estado;
  numeroResolucion?: string;
}

export interface Expediente {
  id: string;
  expediente: string;
  estado: Estado;
  fechaIngreso: string;
  ultimaModificacion: string;
  responsable: string;
  nombreEntidad: string;
  cuitEntidad: string;
  provincia: string;
  departamento: string;
  telefono: string;
  email: string;
  cuitCuilContacto: string;
  contacto: string;
  funcionEnEntidad: string;
  observacionFuncionOtra: string;
  naturalezaEntidad: NaturalezaEntidad;
  referenteEsSolicitante: boolean;
  referenteTecnico: string;
  tipo: Tipo;
  responsableTramite: string;
  nombreSoftware: string;
  versionProduccion: string;
  modalidadPrescripcion: ModalidadPrescripcion;
  consumeREFEPS: boolean;
  urlSitio: string;
  estandarInteroperabilidad: EstandarInteroperabilidad;
  declaracionesJuradas: DeclaracionJurada[];
  imagenReceta?: string;
  imagenPantallaPrescripcion?: string;
  acreditaPersoneria: boolean;
  certificadoInscripcionBD: boolean;
  inscripcionBD: boolean;
  observaciones: string;
  historial: MovimientoHistorial[];
}

export interface ExpedienteResumen {
  id: string;
  expediente: string;
  nombreEntidad: string;
  cuitEntidad: string;
  tipo: Tipo;
  estado: Estado;
  provincia: string;
  responsable: string;
  ultimaModificacion: string;
  departamento: string;
  telefono: string;
  email: string;
  contacto: string;
  cuitCuilContacto: string;
  funcionEnEntidad: string;
  naturalezaEntidad: NaturalezaEntidad;
  referenteTecnico: string;
  referenteEsSolicitante: boolean;
}

export type OrdenExpedientes = 'recientes' | 'antiguos' | '';

export interface FiltrosExpedientes {
  busqueda?: string;
  estado?: Estado | '';
  provincia?: string;
  responsable?: string;
  tipo?: Tipo | '';
  naturalezaEntidad?: 'Pública' | 'Privada' | '';
  ultimaModificacionDesde?: string;
  ultimaModificacionHasta?: string;
  orden?: OrdenExpedientes;
}

export type Metricas = { total: number } & Partial<Record<Estado, number>>;

export interface ColumnaTabla {
  key: keyof ExpedienteResumen;
  label: string;
  defaultVisible: boolean;
  render?: (value: unknown, row: ExpedienteResumen) => ReactNode;
  /** Representación en texto plano de la celda, usada para exportar a Excel/CSV (por defecto usa `String(value)`). */
  exportValue?: (value: unknown, row: ExpedienteResumen) => string;
}
