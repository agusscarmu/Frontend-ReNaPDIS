export const ESTADOS = {
  INGRESADO: 'Ingresado',
  EN_ANALISIS: 'En análisis',
  A_SUBSANAR: 'A subsanar',
  REINGRESADO: 'Reingresado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PUBLICADO: 'Publicado',
  GUARDA_TEMPORAL: 'Guarda temporal',
};

export const ESTADO_CONFIG = {
  [ESTADOS.INGRESADO]: {
    label: 'Ingresado',
    icono: '→',
    color: '#374151',
    bg: '#F3F4F6',
    border: '#D1D5DB',
  },
  [ESTADOS.EN_ANALISIS]: {
    label: 'En análisis',
    icono: '◎',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  [ESTADOS.A_SUBSANAR]: {
    label: 'A subsanar',
    icono: '⚠',
    color: '#92400E',
    bg: '#FFFBEB',
    border: '#FCD34D',
  },
  [ESTADOS.REINGRESADO]: {
    label: 'Reingresado',
    icono: '↩',
    color: '#0369A1',
    bg: '#E0F2FE',
    border: '#7DD3FC',
  },
  [ESTADOS.APROBADO]: {
    label: 'Aprobado',
    icono: '✓',
    color: '#166534',
    bg: '#F0FDF4',
    border: '#86EFAC',
  },
  [ESTADOS.RECHAZADO]: {
    label: 'Rechazado',
    icono: '✕',
    color: '#991B1B',
    bg: '#FEF2F2',
    border: '#FCA5A5',
  },
  [ESTADOS.PUBLICADO]: {
    label: 'Publicado',
    icono: '↑',
    color: '#134E4A',
    bg: '#F0FDFA',
    border: '#5EEAD4',
  },
  [ESTADOS.GUARDA_TEMPORAL]: {
    label: 'Guarda temporal',
    icono: '▣',
    color: '#374151',
    bg: '#F9FAFB',
    border: '#9CA3AF',
  },
};

export const ESTADOS_LIST = Object.values(ESTADOS);

export const KPI_ESTADOS = [
  ESTADOS.INGRESADO,
  ESTADOS.EN_ANALISIS,
  ESTADOS.A_SUBSANAR,
  ESTADOS.APROBADO,
  ESTADOS.PUBLICADO,
  ESTADOS.RECHAZADO,
];
