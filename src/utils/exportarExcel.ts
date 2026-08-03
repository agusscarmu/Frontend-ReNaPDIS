// `xlsx` (SheetJS, npm-registry build 0.18.5) has known advisories with no npm-registry fix
// available: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9). Both
// apply to *parsing* untrusted spreadsheet input. This module only writes workbooks built from
// data already fetched from our own trusted API — it never calls an `xlsx` read/parse function —
// so the advisories don't apply to this usage. Revisit if this module is ever extended to parse
// untrusted (e.g. user-uploaded) spreadsheet files.
import * as XLSX from 'xlsx';
import { obtenerExpediente } from '@/api/expedientes.api';
import type { ColumnaTabla, Expediente, ExpedienteResumen } from '@/types/expediente.types';

const siNo = (v: unknown) => (v ? 'Sí' : 'No');
const CONCURRENCIA = 5;

export function valorCeldaResumen(col: ColumnaTabla, row: ExpedienteResumen): string {
  const raw = row[col.key];
  if (col.exportValue) return col.exportValue(raw, row);
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return siNo(raw);
  return String(raw);
}

export function filaPlataforma(exp: Expediente): Record<string, string> {
  const djResumen = (exp.declaracionesJuradas ?? []).map((dj) => `${dj.texto}: ${siNo(dj.valor)}`).join('; ');
  return {
    Expediente: exp.expediente,
    Entidad: exp.nombreEntidad,
    Tipo: exp.tipo,
    Software: exp.nombreSoftware,
    'Versión en producción': exp.versionProduccion,
    'Modalidad de prescripción': exp.modalidadPrescripcion,
    'Consume REFEPS': siNo(exp.consumeREFEPS),
    'Estándar de interoperabilidad': exp.estandarInteroperabilidad,
    'URL del servicio': exp.urlSitio,
    'Declaraciones juradas': djResumen,
    'Acredita personería': siNo(exp.acreditaPersoneria),
    'Certificado de inscripción BD': siNo(exp.certificadoInscripcionBD),
    'Registro de bases de datos': siNo(exp.inscripcionBD),
    'Imagen de receta adjunta': siNo(!!exp.imagenReceta),
    'Imagen de pantalla de prescripción adjunta': siNo(!!exp.imagenPantallaPrescripcion),
  };
}

// Issues one GET /expedientes/:id call per record (batched at CONCURRENCIA=5 concurrent
// requests), with no total cap and no cancel/timeout path. This is an accepted v1 tradeoff
// (see design spec, decision #2) sized for typical dashboard-filtered result sets, avoiding a
// backend change for this first version. If export is ever used against very large unfiltered
// result sets, this should get a cap, a progress indicator, or a backend endpoint that returns
// Plataforma fields directly in the list response.
export async function obtenerDetallesConLimite(
  expedientes: ExpedienteResumen[]
): Promise<{ detalles: Expediente[]; fallidos: number }> {
  const detalles: Expediente[] = [];
  let fallidos = 0;

  for (let i = 0; i < expedientes.length; i += CONCURRENCIA) {
    const lote = expedientes.slice(i, i + CONCURRENCIA);
    const resultados = await Promise.allSettled(lote.map((e) => obtenerExpediente(e.id)));
    for (const resultado of resultados) {
      if (resultado.status === 'fulfilled') detalles.push(resultado.value);
      else fallidos += 1;
    }
  }

  return { detalles, fallidos };
}

export function hojaDesdeColumnas(expedientes: ExpedienteResumen[], columnas: ColumnaTabla[]): XLSX.WorkSheet {
  const filas = expedientes.map((row) => {
    const fila: Record<string, string> = {};
    for (const col of columnas) fila[col.label] = valorCeldaResumen(col, row);
    return fila;
  });
  return XLSX.utils.json_to_sheet(filas);
}

export async function exportarExpedientesExcel(
  expedientes: ExpedienteResumen[],
  columnas: ColumnaTabla[],
  nombreArchivo = 'tramites'
): Promise<{ fallidos: number }> {
  const { detalles, fallidos } = await obtenerDetallesConLimite(expedientes);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaDesdeColumnas(expedientes, columnas), 'Trámites');
  XLSX.utils.book_append_sheet(wb, hojaDesdeColumnas(expedientes, columnas), 'Agenda');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalles.map(filaPlataforma)), 'Plataforma');

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${nombreArchivo}_${fecha}.xlsx`);

  return { fallidos };
}
