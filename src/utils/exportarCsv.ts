import type { ColumnaTabla, ExpedienteResumen } from '@/types/expediente.types';

const DELIMITADOR = ';';

function escaparCelda(valor: string): string {
  if (/[";\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function valorCelda(col: ColumnaTabla, row: ExpedienteResumen): string {
  const raw = row[col.key];
  if (col.exportValue) return col.exportValue(raw, row);
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'Sí' : 'No';
  return String(raw);
}

/**
 * Genera un CSV (delimitado por ";", con BOM UTF-8) a partir de las columnas visibles
 * y las filas ya filtradas, y dispara la descarga en el navegador. Excel lo abre
 * directamente con las columnas separadas y los acentos/ñ bien renderizados.
 */
export function exportarExpedientesCsv(expedientes: ExpedienteResumen[], columnas: ColumnaTabla[], nombreArchivo = 'tramites'): void {
  const encabezado = columnas.map((c) => escaparCelda(c.label)).join(DELIMITADOR);
  const filas = expedientes.map((row) => columnas.map((col) => escaparCelda(valorCelda(col, row))).join(DELIMITADOR));
  const contenido = [encabezado, ...filas].join('\r\n');

  const BOM = '﻿';
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const fecha = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nombreArchivo}_${fecha}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
