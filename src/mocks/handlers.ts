import { http, HttpResponse, delay } from 'msw';
import { EXPEDIENTES_MOCK } from './data/expedientes.data';
import type { ExpedienteResumen, Metricas } from '@/types/expediente.types';

const normalizar = (str = '') => str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function aResumen(e: (typeof EXPEDIENTES_MOCK)[number]): ExpedienteResumen {
  return {
    id: e.id,
    expediente: e.expediente,
    nombreEntidad: e.nombreEntidad,
    cuitEntidad: e.cuitEntidad,
    tipo: e.tipo,
    estado: e.estado,
    provincia: e.provincia,
    responsable: e.responsable,
    ultimaModificacion: e.ultimaModificacion,
    departamento: e.departamento,
    telefono: e.telefono,
    email: e.email,
    contacto: e.contacto,
    cuitCuilContacto: e.cuitCuilContacto,
    funcionEnEntidad: e.funcionEnEntidad,
    naturalezaEntidad: e.naturalezaEntidad,
    referenteTecnico: e.referenteTecnico,
    referenteEsSolicitante: e.referenteEsSolicitante,
  };
}

export const handlers = [
  http.get('/api/expedientes', async ({ request }) => {
    await delay(350);
    const url = new URL(request.url);
    const busqueda = url.searchParams.get('busqueda') ?? '';
    const estado = url.searchParams.get('estado') ?? '';
    const provincia = url.searchParams.get('provincia') ?? '';
    const responsable = url.searchParams.get('responsable') ?? '';
    const tipo = url.searchParams.get('tipo') ?? '';
    const naturalezaEntidad = url.searchParams.get('naturalezaEntidad') ?? '';
    const ultimaModificacionDesde = url.searchParams.get('ultimaModificacionDesde') ?? '';
    const ultimaModificacionHasta = url.searchParams.get('ultimaModificacionHasta') ?? '';
    const orden = url.searchParams.get('orden') ?? '';

    let resultado = [...EXPEDIENTES_MOCK];

    if (busqueda) {
      const q = normalizar(busqueda);
      resultado = resultado.filter(
        (e) =>
          normalizar(e.expediente).includes(q) ||
          normalizar(e.cuitEntidad).includes(q) ||
          normalizar(e.nombreEntidad).includes(q)
      );
    }
    if (estado) resultado = resultado.filter((e) => e.estado === estado);
    if (provincia) resultado = resultado.filter((e) => e.provincia === provincia);
    if (responsable) resultado = resultado.filter((e) => e.responsable === responsable);
    if (tipo) resultado = resultado.filter((e) => e.tipo === tipo);
    if (naturalezaEntidad) resultado = resultado.filter((e) => e.naturalezaEntidad === naturalezaEntidad);
    if (ultimaModificacionDesde) resultado = resultado.filter((e) => e.ultimaModificacion >= ultimaModificacionDesde);
    if (ultimaModificacionHasta) resultado = resultado.filter((e) => e.ultimaModificacion <= ultimaModificacionHasta);

    if (orden === 'recientes') resultado.sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));
    if (orden === 'antiguos') resultado.sort((a, b) => a.fechaIngreso.localeCompare(b.fechaIngreso));

    return HttpResponse.json(resultado.map(aResumen));
  }),

  http.get('/api/expedientes/metricas', async () => {
    await delay(300);
    const metricas: Metricas = { total: EXPEDIENTES_MOCK.length };
    for (const exp of EXPEDIENTES_MOCK) {
      metricas[exp.estado] = (metricas[exp.estado] ?? 0) + 1;
    }
    return HttpResponse.json(metricas);
  }),

  http.get('/api/expedientes/responsables', async () => {
    await delay(150);
    const responsables = [...new Set(EXPEDIENTES_MOCK.map((e) => e.responsable))].sort();
    return HttpResponse.json(responsables);
  }),

  http.get('/api/expedientes/:id', async ({ params }) => {
    await delay(400);
    const exp = EXPEDIENTES_MOCK.find((e) => e.id === params.id);
    if (!exp) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(exp);
  }),
];
