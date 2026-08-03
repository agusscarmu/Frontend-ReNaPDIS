import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  valorCeldaResumen,
  filaPlataforma,
  obtenerDetallesConLimite,
  hojaDesdeColumnas,
  exportarExpedientesExcel,
} from './exportarExcel';
import type { ColumnaTabla, ExpedienteResumen, Expediente } from '@/types/expediente.types';

vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  return { ...actual, writeFile: vi.fn() };
});

const RESUMEN_BASE: ExpedienteResumen = {
  id: '1',
  expediente: 'EX-2026-00123456-APN-MS',
  nombreEntidad: 'Hospital Test',
  cuitEntidad: '30-11111111-1',
  tipo: 'Recetario',
  estado: 'Aprobado',
  provincia: 'Buenos Aires',
  responsable: 'Ana Pérez',
  ultimaModificacion: '2026-07-01',
  departamento: 'Sistemas',
  telefono: '11-2222-3333',
  email: 'contacto@hospital.test',
  contacto: 'Juan López',
  cuitCuilContacto: '20-22222222-2',
  funcionEnEntidad: 'Director técnico',
  naturalezaEntidad: 'Pública',
  referenteTecnico: 'Marta Ruiz',
  referenteEsSolicitante: true,
};

describe('valorCeldaResumen', () => {
  it('usa exportValue cuando está definido', () => {
    const col: ColumnaTabla = {
      key: 'ultimaModificacion',
      label: 'Última modif.',
      defaultVisible: true,
      exportValue: () => '01/07/2026',
    };
    expect(valorCeldaResumen(col, RESUMEN_BASE)).toBe('01/07/2026');
  });

  it('convierte booleanos a Sí/No', () => {
    const col: ColumnaTabla = { key: 'referenteEsSolicitante', label: 'Referente = solicitante', defaultVisible: false };
    expect(valorCeldaResumen(col, RESUMEN_BASE)).toBe('Sí');
    expect(valorCeldaResumen(col, { ...RESUMEN_BASE, referenteEsSolicitante: false })).toBe('No');
  });

  it('convierte valores nulos/indefinidos a string vacío', () => {
    const col: ColumnaTabla = { key: 'contacto', label: 'Contacto', defaultVisible: false };
    expect(valorCeldaResumen(col, { ...RESUMEN_BASE, contacto: undefined as unknown as string })).toBe('');
  });

  it('convierte el resto a string plano', () => {
    const col: ColumnaTabla = { key: 'nombreEntidad', label: 'Entidad', defaultVisible: true };
    expect(valorCeldaResumen(col, RESUMEN_BASE)).toBe('Hospital Test');
  });
});

const EXPEDIENTE_BASE: Expediente = {
  id: '1',
  expediente: 'EX-2026-00123456-APN-MS',
  estado: 'Aprobado',
  fechaIngreso: '2026-01-01',
  ultimaModificacion: '2026-07-01',
  responsable: 'Ana Pérez',
  nombreEntidad: 'Hospital Test',
  cuitEntidad: '30-11111111-1',
  provincia: 'Buenos Aires',
  departamento: 'Sistemas',
  telefono: '11-2222-3333',
  email: 'contacto@hospital.test',
  cuitCuilContacto: '20-22222222-2',
  contacto: 'Juan López',
  funcionEnEntidad: 'Director técnico',
  observacionFuncionOtra: '',
  naturalezaEntidad: 'Pública',
  referenteEsSolicitante: true,
  referenteTecnico: 'Marta Ruiz',
  tipo: 'Recetario',
  responsableTramite: 'Ana Pérez',
  nombreSoftware: 'SistemaX',
  versionProduccion: '2.3.1',
  modalidadPrescripcion: 'Ambos',
  consumeREFEPS: true,
  urlSitio: 'https://sistemax.test',
  estandarInteroperabilidad: 'HL7 FHIR',
  declaracionesJuradas: [
    { clave: 'a', texto: 'Cumple normativa X', valor: true },
    { clave: 'b', texto: 'Cumple normativa Y', valor: false },
  ],
  imagenReceta: 'receta.png',
  imagenPantallaPrescripcion: undefined,
  acreditaPersoneria: true,
  certificadoInscripcionBD: false,
  inscripcionBD: true,
  observaciones: '',
  historial: [],
};

describe('filaPlataforma', () => {
  it('arma la fila con los campos de plataforma y las DJ resumidas', () => {
    expect(filaPlataforma(EXPEDIENTE_BASE)).toEqual({
      Expediente: 'EX-2026-00123456-APN-MS',
      Entidad: 'Hospital Test',
      Tipo: 'Recetario',
      Software: 'SistemaX',
      'Versión en producción': '2.3.1',
      'Modalidad de prescripción': 'Ambos',
      'Consume REFEPS': 'Sí',
      'Estándar de interoperabilidad': 'HL7 FHIR',
      'URL del servicio': 'https://sistemax.test',
      'Declaraciones juradas': 'Cumple normativa X: Sí; Cumple normativa Y: No',
      'Acredita personería': 'Sí',
      'Certificado de inscripción BD': 'No',
      'Registro de bases de datos': 'Sí',
      'Imagen de receta adjunta': 'Sí',
      'Imagen de pantalla de prescripción adjunta': 'No',
    });
  });

  it('devuelve cadena vacía en Declaraciones juradas cuando no hay ninguna', () => {
    expect(filaPlataforma({ ...EXPEDIENTE_BASE, declaracionesJuradas: [] })['Declaraciones juradas']).toBe('');
  });
});

afterEach(() => {
  server.resetHandlers();
});

function resumen(id: string, overrides: Partial<ExpedienteResumen> = {}): ExpedienteResumen {
  return { ...RESUMEN_BASE, id, expediente: `EX-${id}`, ...overrides };
}

function detalle(id: string): Expediente {
  return { ...EXPEDIENTE_BASE, id, expediente: `EX-${id}` };
}

describe('obtenerDetallesConLimite', () => {
  it('devuelve el detalle de cada expediente cuando todas las llamadas son exitosas', async () => {
    server.use(http.get('/api/expedientes/:id', ({ params }) => HttpResponse.json(detalle(params.id as string))));

    const { detalles, fallidos } = await obtenerDetallesConLimite([resumen('1'), resumen('2')]);

    expect(detalles.map((d) => d.id)).toEqual(['1', '2']);
    expect(fallidos).toBe(0);
  });

  it('excluye los expedientes cuyo detalle falla y cuenta los fallidos, sin abortar el resto', async () => {
    server.use(
      http.get('/api/expedientes/:id', ({ params }) => {
        if (params.id === '2') return new HttpResponse(null, { status: 500 });
        return HttpResponse.json(detalle(params.id as string));
      })
    );

    const { detalles, fallidos } = await obtenerDetallesConLimite([resumen('1'), resumen('2'), resumen('3')]);

    expect(detalles.map((d) => d.id)).toEqual(['1', '3']);
    expect(fallidos).toBe(1);
  });
});

describe('hojaDesdeColumnas', () => {
  it('arma una fila por expediente usando la etiqueta de cada columna como header', async () => {
    const columnas: ColumnaTabla[] = [
      { key: 'expediente', label: 'Expediente', defaultVisible: true },
      { key: 'nombreEntidad', label: 'Entidad', defaultVisible: true },
    ];

    const hoja = hojaDesdeColumnas([resumen('1', { nombreEntidad: 'Entidad Uno' })], columnas);

    const XLSX = await import('xlsx');
    expect(XLSX.utils.sheet_to_json(hoja)).toEqual([{ Expediente: 'EX-1', Entidad: 'Entidad Uno' }]);
  });
});

describe('exportarExpedientesExcel', () => {
  const COLUMNAS: ColumnaTabla[] = [
    { key: 'expediente', label: 'Expediente', defaultVisible: true },
    { key: 'nombreEntidad', label: 'Entidad', defaultVisible: true },
  ];

  afterEach(async () => {
    const XLSX = await import('xlsx');
    vi.mocked(XLSX.writeFile).mockClear();
  });

  it('genera un workbook con las 3 hojas esperadas y descarga con el nombre correcto', async () => {
    server.use(http.get('/api/expedientes/:id', ({ params }) => HttpResponse.json(detalle(params.id as string))));
    const expedientes = [resumen('1'), resumen('2')];

    const { fallidos } = await exportarExpedientesExcel(expedientes, COLUMNAS, 'tramites');

    expect(fallidos).toBe(0);
    const XLSX = await import('xlsx');
    const writeFileMock = vi.mocked(XLSX.writeFile);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    const [wb, nombreArchivo] = writeFileMock.mock.calls[0];
    expect(wb.SheetNames).toEqual(['Trámites', 'Agenda', 'Plataforma']);
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Trámites'])).toEqual([
      { Expediente: 'EX-1', Entidad: 'Hospital Test' },
      { Expediente: 'EX-2', Entidad: 'Hospital Test' },
    ]);
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Agenda'])).toEqual([
      expect.objectContaining({
        Expediente: 'EX-1',
        Entidad: 'Hospital Test',
        CUIT: '30-11111111-1',
        Naturaleza: 'Pública',
        Provincia: 'Buenos Aires',
        Departamento: 'Sistemas',
        Contacto: 'Juan López',
        Función: 'Director técnico',
        'CUIT/CUIL contacto': '20-22222222-2',
        Teléfono: '11-2222-3333',
        Email: 'contacto@hospital.test',
        'Referente técnico': 'Marta Ruiz',
        'Referente = solicitante': 'Sí',
        Responsable: 'Ana Pérez',
        Estado: 'Aprobado',
      }),
      expect.objectContaining({ Expediente: 'EX-2' }),
    ]);
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Plataforma'])).toHaveLength(2);
    expect(nombreArchivo).toMatch(/^tramites_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it('excluye de Plataforma los expedientes cuyo detalle falla, sin afectar Trámites/Agenda', async () => {
    server.use(
      http.get('/api/expedientes/:id', ({ params }) => {
        if (params.id === '2') return new HttpResponse(null, { status: 500 });
        return HttpResponse.json(detalle(params.id as string));
      })
    );
    const expedientes = [resumen('1'), resumen('2')];

    const { fallidos } = await exportarExpedientesExcel(expedientes, COLUMNAS, 'tramites');

    expect(fallidos).toBe(1);
    const XLSX = await import('xlsx');
    const [wb] = vi.mocked(XLSX.writeFile).mock.calls[0];
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Trámites'])).toHaveLength(2);
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Agenda'])).toHaveLength(2);
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Plataforma'])).toHaveLength(1);
  });
});
