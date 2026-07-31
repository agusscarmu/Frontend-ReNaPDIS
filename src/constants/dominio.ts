import type {
  Tipo,
  NaturalezaEntidad,
  ModalidadPrescripcion,
  EstandarInteroperabilidad,
} from '@/types/expediente.types';

export const TIPOS = {
  RECETARIO: 'Recetario',
  REPOSITORIO: 'Repositorio',
} as const satisfies Record<string, Tipo>;

export const TIPOS_LIST: Tipo[] = Object.values(TIPOS);

export const NATURALEZA_ENTIDAD = {
  PUBLICA: 'Pública',
  PRIVADA: 'Privada',
  OBRA_SOCIAL: 'Obra social',
} as const satisfies Record<string, NaturalezaEntidad>;

export const MODALIDAD_PRESCRIPCION = {
  GENERICO: 'Genérico',
  COMERCIAL: 'Comercial',
  AMBOS: 'Ambos',
} as const satisfies Record<string, ModalidadPrescripcion>;

export const ESTANDAR_INTEROPERABILIDAD = {
  ADESFA: 'ADESFA',
  HL7_FHIR: 'HL7 FHIR',
  JSON_NO_FHIR: 'JSON no FHIR',
  OTROS: 'Otros',
} as const satisfies Record<string, EstandarInteroperabilidad>;

export const TIPO_MOVIMIENTO = {
  INGRESO: 'Ingreso',
  SUBSANACION: 'Subsanación',
  ENVIO_CORREO: 'Envío de correo',
  HABILITACION_SUBSANACION: 'Habilitación de subsanación',
  REINGRESO: 'Reingreso',
  NUMERO_RESOLUCION: 'Número de resolución',
  GUARDA_TEMPORAL: 'Guarda temporal',
} as const;
