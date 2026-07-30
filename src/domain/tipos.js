export const TIPOS = {
  RECETARIO: 'Recetario',
  REPOSITORIO: 'Repositorio',
};

export const NATURALEZA_ENTIDAD = {
  PUBLICA: 'Pública',
  PRIVADA: 'Privada',
  OBRA_SOCIAL: 'Obra social',
};

export const MODALIDAD_PRESCRIPCION = {
  GENERICO: 'Genérico',
  COMERCIAL: 'Comercial',
  AMBOS: 'Ambos',
};

export const ESTANDAR_INTEROPERABILIDAD = {
  ADESFA: 'ADESFA',
  HL7_FHIR: 'HL7 FHIR',
  JSON_NO_FHIR: 'JSON no FHIR',
  OTROS: 'Otros',
};

export const TIPO_MOVIMIENTO = {
  INGRESO: 'Ingreso',
  SUBSANACION: 'Subsanación',
  ENVIO_CORREO: 'Envío de correo',
  HABILITACION_SUBSANACION: 'Habilitación de subsanación',
  REINGRESO: 'Reingreso',
  NUMERO_RESOLUCION: 'Número de resolución',
  GUARDA_TEMPORAL: 'Guarda temporal',
};

export const PROVINCIAS = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
  'CABA',
];

export const DECLARACIONES_JURADAS = [
  { clave: 'a', texto: 'Base de datos inscripta en Datos Personales' },
  { clave: 'b', texto: 'Protección de datos personales' },
  { clave: 'c', texto: 'Derechos del paciente' },
  { clave: 'd', texto: 'Ley de recetas electrónicas o digitales' },
  { clave: 'e', texto: 'La plataforma permite acceso de farmacias al repositorio' },
  { clave: 'f', texto: 'Ley 25649 (libertad de prescripción y dispensa)' },
  { clave: 'g', texto: 'Art. 4 Anexo Dec 98/23' },
  { clave: 'h', texto: 'Compromiso de actualización de información' },
];
