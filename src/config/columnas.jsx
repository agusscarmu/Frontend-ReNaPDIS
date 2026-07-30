import EstadoBadge from '@/components/ui/EstadoBadge.jsx';

export function formatFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const siNo = (v) => (v ? 'Sí' : 'No');

// Catálogo completo de columnas disponibles para la tabla del tablero.
// Basado en la hoja "Agenda" del Excel (+ Tipo/Última modif. de Recetarios/Repositorios).
// `defaultVisible` define el set inicial; el usuario elige el resto desde el selector de
// columnas. (A futuro, la visibilidad se derivará de permisos de rol.)
// La columna de acción ("Ver detalle") la agrega TablaExpedientes y no es configurable.
export const COLUMNAS_TABLA = [
  { key: 'expediente',             label: 'Expediente',          defaultVisible: true },
  { key: 'nombreEntidad',          label: 'Entidad',             defaultVisible: true },
  { key: 'cuitEntidad',            label: 'CUIT',                defaultVisible: true },
  { key: 'tipo',                   label: 'Tipo',                defaultVisible: true },
  { key: 'estado',                 label: 'Estado',              defaultVisible: true,  render: (v) => <EstadoBadge estado={v} /> },
  { key: 'provincia',              label: 'Provincia',           defaultVisible: true },
  { key: 'responsable',            label: 'Responsable',         defaultVisible: true },
  { key: 'ultimaModificacion',     label: 'Última modif.',       defaultVisible: true,  render: (v) => formatFecha(v) },
  // Resto de columnas de la hoja Agenda, disponibles vía el selector:
  { key: 'departamento',           label: 'Departamento',        defaultVisible: false },
  { key: 'telefono',               label: 'Teléfono',            defaultVisible: false },
  { key: 'email',                  label: 'Email',               defaultVisible: false },
  { key: 'contacto',               label: 'Contacto',            defaultVisible: false },
  { key: 'cuitCuilContacto',       label: 'CUIT/CUIL contacto',  defaultVisible: false },
  { key: 'funcionEnEntidad',       label: 'Función',             defaultVisible: false },
  { key: 'naturalezaEntidad',      label: 'Naturaleza',          defaultVisible: false },
  { key: 'referenteTecnico',       label: 'Referente técnico',   defaultVisible: false },
  { key: 'referenteEsSolicitante', label: 'Referente = solicitante', defaultVisible: false, render: (v) => siNo(v) },
];

// Keys visibles por defecto (orden del catálogo).
export const COLUMNAS_DEFAULT_KEYS = COLUMNAS_TABLA
  .filter((c) => c.defaultVisible)
  .map((c) => c.key);
