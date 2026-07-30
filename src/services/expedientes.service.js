import { EXPEDIENTES_MOCK } from '../mocks/expedientes.mock.js';

const simularLatencia = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const normalizar = (str = '') =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function listarExpedientes(filtros = {}) {
  await simularLatencia(350);

  let resultado = [...EXPEDIENTES_MOCK];

  const { busqueda, estado, provincia, responsable } = filtros;

  if (busqueda) {
    const q = normalizar(busqueda);
    resultado = resultado.filter(
      (e) =>
        normalizar(e.expediente).includes(q) ||
        normalizar(e.cuitEntidad).includes(q) ||
        normalizar(e.nombreEntidad).includes(q)
    );
  }

  if (estado) {
    resultado = resultado.filter((e) => e.estado === estado);
  }

  if (provincia) {
    resultado = resultado.filter((e) => e.provincia === provincia);
  }

  if (responsable) {
    resultado = resultado.filter((e) => e.responsable === responsable);
  }

  return resultado.map((e) => ({
    id: e.id,
    expediente: e.expediente,
    nombreEntidad: e.nombreEntidad,
    cuitEntidad: e.cuitEntidad,
    tipo: e.tipo,
    estado: e.estado,
    provincia: e.provincia,
    responsable: e.responsable,
    ultimaModificacion: e.ultimaModificacion,
    // Resto de campos de la hoja Agenda (para las columnas opcionales del selector):
    departamento: e.departamento,
    telefono: e.telefono,
    email: e.email,
    contacto: e.contacto,
    cuitCuilContacto: e.cuitCuilContacto,
    funcionEnEntidad: e.funcionEnEntidad,
    naturalezaEntidad: e.naturalezaEntidad,
    referenteTecnico: e.referenteTecnico,
    referenteEsSolicitante: e.referenteEsSolicitante,
  }));
}

export async function obtenerExpediente(id) {
  await simularLatencia(400);
  const exp = EXPEDIENTES_MOCK.find((e) => e.id === id);
  if (!exp) throw new Error(`Expediente ${id} no encontrado`);
  return { ...exp };
}

export async function obtenerMetricas() {
  await simularLatencia(300);

  const metricas = { total: EXPEDIENTES_MOCK.length };
  for (const exp of EXPEDIENTES_MOCK) {
    metricas[exp.estado] = (metricas[exp.estado] ?? 0) + 1;
  }
  return metricas;
}

export function obtenerResponsables() {
  return [...new Set(EXPEDIENTES_MOCK.map((e) => e.responsable))].sort();
}
