# Exportación a Excel multi-hoja (Agenda + Plataforma) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la exportación CSV del Tablero por un archivo `.xlsx` real con 3 hojas: "Trámites" (comportamiento actual), "Agenda" (mismas columnas visibles) y "Plataforma" (detalle por expediente obtenido on-demand).

**Architecture:** Un nuevo util `src/utils/exportarExcel.ts` (usando `xlsx`/SheetJS) reemplaza `src/utils/exportarCsv.ts`. Al exportar, se piden en paralelo limitado los detalles (`obtenerExpediente`) de cada expediente filtrado, se arma un `XLSX.WorkBook` de 3 hojas y se dispara la descarga. `ExportarExcelButton.tsx` pasa a ser async, con estado de carga y aviso de registros fallidos.

**Tech Stack:** React 18 + TypeScript, `xlsx` (SheetJS, nueva dependencia), Vitest + Testing Library + MSW (stack de test ya existente en el proyecto).

## Global Constraints

- Librería de Excel: `xlsx` (SheetJS community edition) vía `npm install xlsx`. No usar `exceljs`.
- Nombres de hoja exactos, en este orden: `Trámites`, `Agenda`, `Plataforma`.
- Nombre de archivo: `${nombreArchivo}_YYYY-MM-DD.xlsx` (mismo patrón que el CSV actual, extensión nueva).
- Concurrencia de fetch de detalle: lotes de 5 en paralelo (`Promise.allSettled` por lote), nunca todo en un solo `Promise.all`.
- Un expediente cuyo detalle falla se excluye solo de la hoja "Plataforma"; "Trámites" y "Agenda" no se ven afectadas.
- Columnas de "Trámites" y "Agenda": exactamente las mismas `columnas` (visibles/tildadas) recibidas por el componente — no hay un set fijo independiente para "Agenda".
- Declaraciones juradas en "Plataforma": una sola celda por expediente, formato `"{texto}: Sí|No"` unidos con `"; "`.
- Sin barra de progreso numérica, sin sistema de toasts: el aviso de registros fallidos es texto inline junto al botón (mismo patrón que `src/pages/Login.tsx`, clase `text-xs text-red-600`), texto exacto: `"{fallidos} registro(s) no se pudieron incluir en el detalle de Plataforma."`.
- No se agrega hoja de historial ni se cambia el endpoint `/expedientes`.

---

### Task 1: Agregar la dependencia `xlsx`

**Files:**
- Modify: `package.json`, `package-lock.json` (vía `npm install`)

**Interfaces:**
- Produces: paquete `xlsx` instalado e importable como `import * as XLSX from 'xlsx'` en el resto de las tareas.

- [ ] **Step 1: Instalar la dependencia**

Run: `npm install xlsx`

- [ ] **Step 2: Verificar que el paquete se resuelve correctamente con TypeScript**

Crear un archivo temporal `src/utils/_xlsx_smoke.ts` con el contenido:

```ts
import * as XLSX from 'xlsx';
const wb = XLSX.utils.book_new();
console.log(typeof wb);
```

Run: `npm run type-check`
Expected: sin errores de tipos relacionados a `xlsx`.

Luego borrar `src/utils/_xlsx_smoke.ts` (era solo para verificar la instalación, no forma parte del código final).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(front): agregar dependencia xlsx para export multi-hoja"
```

---

### Task 2: Helpers puros de celdas — `valorCeldaResumen` y `filaPlataforma`

**Files:**
- Create: `src/utils/exportarExcel.ts`
- Test: `src/utils/exportarExcel.test.ts`

**Interfaces:**
- Consumes: tipos `ColumnaTabla`, `ExpedienteResumen`, `Expediente`, `DeclaracionJurada` de `@/types/expediente.types` (ya existentes, sin cambios).
- Produces:
  - `valorCeldaResumen(col: ColumnaTabla, row: ExpedienteResumen): string`
  - `filaPlataforma(exp: Expediente): Record<string, string>`
  - Ambas exportadas desde `src/utils/exportarExcel.ts`, usadas por las Tasks 3 y 4.

- [ ] **Step 1: Escribir los tests de `valorCeldaResumen` (deben fallar)**

Crear `src/utils/exportarExcel.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { valorCeldaResumen, filaPlataforma } from './exportarExcel';
import type { ColumnaTabla, ExpedienteResumen, Expediente } from '@/types/expediente.types';

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
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- exportarExcel`
Expected: FAIL — `exportarExcel.ts` no existe todavía (o no exporta `valorCeldaResumen`/`filaPlataforma`).

- [ ] **Step 3: Implementar `valorCeldaResumen`**

Crear `src/utils/exportarExcel.ts`:

```ts
import type { ColumnaTabla, Expediente, ExpedienteResumen } from '@/types/expediente.types';

const siNo = (v: unknown) => (v ? 'Sí' : 'No');

export function valorCeldaResumen(col: ColumnaTabla, row: ExpedienteResumen): string {
  const raw = row[col.key];
  if (col.exportValue) return col.exportValue(raw, row);
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return siNo(raw);
  return String(raw);
}
```

(`filaPlataforma` se agrega en el Step 5, dejar el archivo con solo esto por ahora.)

- [ ] **Step 4: Correr los tests de `valorCeldaResumen` y verificar que pasan**

Run: `npm test -- exportarExcel`
Expected: los 4 tests de `valorCeldaResumen` PASS (los de `filaPlataforma`, agregados en el Step 5, van a fallar por ahora — está bien, todavía no existen en el archivo de test).

- [ ] **Step 5: Escribir los tests de `filaPlataforma` (deben fallar)**

Agregar al final de `src/utils/exportarExcel.test.ts`:

```ts
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
```

- [ ] **Step 6: Correr los tests y verificar que los de `filaPlataforma` fallan**

Run: `npm test -- exportarExcel`
Expected: FAIL — `filaPlataforma` no está exportada todavía.

- [ ] **Step 7: Implementar `filaPlataforma`**

Agregar a `src/utils/exportarExcel.ts`:

```ts
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
```

- [ ] **Step 8: Correr todos los tests del archivo y verificar que pasan**

Run: `npm test -- exportarExcel`
Expected: PASS (6 tests: 4 de `valorCeldaResumen` + 2 de `filaPlataforma`).

- [ ] **Step 9: Commit**

```bash
git add src/utils/exportarExcel.ts src/utils/exportarExcel.test.ts
git commit -m "feat(front): helpers de celdas para export Excel (resumen y plataforma)"
```

---

### Task 3: Fetch de detalle con concurrencia limitada y armado de hoja desde columnas

**Files:**
- Modify: `src/utils/exportarExcel.ts`
- Test: `src/utils/exportarExcel.test.ts`

**Interfaces:**
- Consumes: `obtenerExpediente(id: string): Promise<Expediente>` de `@/api/expedientes.api` (ya existente, sin cambios); `valorCeldaResumen` de la Task 2; MSW `server` de `@/mocks/server` para tests.
- Produces:
  - `obtenerDetallesConLimite(expedientes: ExpedienteResumen[]): Promise<{ detalles: Expediente[]; fallidos: number }>`
  - `hojaDesdeColumnas(expedientes: ExpedienteResumen[], columnas: ColumnaTabla[]): XLSX.WorkSheet`
  - Ambas usadas por `exportarExpedientesExcel` en la Task 4.

- [ ] **Step 1: Escribir los tests de `obtenerDetallesConLimite` (deben fallar)**

Reemplazar las líneas de import al inicio de `src/utils/exportarExcel.test.ts` (las 3 líneas dejadas por la Task 2) por:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { valorCeldaResumen, filaPlataforma, obtenerDetallesConLimite, hojaDesdeColumnas } from './exportarExcel';
import type { ColumnaTabla, ExpedienteResumen, Expediente } from '@/types/expediente.types';
```

Y agregar al final del archivo:

```ts
afterEach(() => server.resetHandlers());

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
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- exportarExcel`
Expected: FAIL — `obtenerDetallesConLimite` y `hojaDesdeColumnas` no existen todavía.

- [ ] **Step 3: Implementar `obtenerDetallesConLimite` y `hojaDesdeColumnas`**

Agregar a `src/utils/exportarExcel.ts` (junto con el import de `XLSX` y `obtenerExpediente`):

```ts
import * as XLSX from 'xlsx';
import { obtenerExpediente } from '@/api/expedientes.api';

const CONCURRENCIA = 5;

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
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test -- exportarExcel`
Expected: PASS (los 6 tests previos + los 3 nuevos = 9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/exportarExcel.ts src/utils/exportarExcel.test.ts
git commit -m "feat(front): fetch de detalle con concurrencia limitada y armado de hoja para export Excel"
```

---

### Task 4: Orquestación — `exportarExpedientesExcel` (armado del workbook y descarga)

**Files:**
- Modify: `src/utils/exportarExcel.ts`
- Test: `src/utils/exportarExcel.test.ts`

**Interfaces:**
- Consumes: `obtenerDetallesConLimite`, `hojaDesdeColumnas`, `filaPlataforma` (Tasks 2-3); `XLSX.utils.book_new`, `XLSX.utils.book_append_sheet`, `XLSX.writeFile`.
- Produces: `exportarExpedientesExcel(expedientes: ExpedienteResumen[], columnas: ColumnaTabla[], nombreArchivo?: string): Promise<{ fallidos: number }>` — es la función que va a consumir `ExportarExcelButton.tsx` en la Task 5.

- [ ] **Step 1: Escribir los tests de `exportarExpedientesExcel` (deben fallar)**

Reemplazar las líneas de import al inicio de `src/utils/exportarExcel.test.ts` (las dejadas por la Task 3) por:

```ts
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
```

(El `vi.mock` debe quedar al nivel superior del archivo, junto a los demás imports — Vitest hace hoisting automático de `vi.mock`, así que su posición relativa a los `import` no importa en tiempo de ejecución, pero convencionalmente va después de ellos.)

Y agregar al final del archivo:

```ts
describe('exportarExpedientesExcel', () => {
  const COLUMNAS: ColumnaTabla[] = [
    { key: 'expediente', label: 'Expediente', defaultVisible: true },
    { key: 'nombreEntidad', label: 'Entidad', defaultVisible: true },
  ];

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
    expect(XLSX.utils.sheet_to_json(wb.Sheets['Trámites'])).toEqual(XLSX.utils.sheet_to_json(wb.Sheets['Agenda']));
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
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- exportarExcel`
Expected: FAIL — `exportarExpedientesExcel` no existe todavía.

- [ ] **Step 3: Implementar `exportarExpedientesExcel`**

Agregar a `src/utils/exportarExcel.ts`:

```ts
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
```

- [ ] **Step 4: Correr todos los tests del archivo y verificar que pasan**

Run: `npm test -- exportarExcel`
Expected: PASS (11 tests en total).

- [ ] **Step 5: Correr el type-check**

Run: `npm run type-check`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/utils/exportarExcel.ts src/utils/exportarExcel.test.ts
git commit -m "feat(front): armar workbook de 3 hojas y disparar descarga en exportarExpedientesExcel"
```

---

### Task 5: `ExportarExcelButton` async con estado de carga y aviso de fallidos; eliminar el CSV viejo

**Files:**
- Modify: `src/components/tablero/ExportarExcelButton.tsx`
- Create: `src/components/tablero/ExportarExcelButton.test.tsx`
- Delete: `src/utils/exportarCsv.ts`

**Interfaces:**
- Consumes: `exportarExpedientesExcel(expedientes, columnas): Promise<{ fallidos: number }>` de `@/utils/exportarExcel` (Task 4).
- Produces: mismo componente `ExportarExcelButton` con la misma prop interface (`{ expedientes, columnas }`) que ya consume `src/pages/Tablero.tsx:109` — no requiere cambios en `Tablero.tsx`.

- [ ] **Step 1: Escribir los tests del componente (deben fallar)**

Crear `src/components/tablero/ExportarExcelButton.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportarExcelButton from './ExportarExcelButton';
import { exportarExpedientesExcel } from '@/utils/exportarExcel';
import type { ColumnaTabla, ExpedienteResumen } from '@/types/expediente.types';

vi.mock('@/utils/exportarExcel', () => ({ exportarExpedientesExcel: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const COLUMNAS: ColumnaTabla[] = [{ key: 'expediente', label: 'Expediente', defaultVisible: true }];
const EXPEDIENTES: ExpedienteResumen[] = [
  {
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
  },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('ExportarExcelButton', () => {
  it('deshabilita el botón y muestra "Generando..." mientras exporta', async () => {
    const { promise, resolve } = deferred<{ fallidos: number }>();
    vi.mocked(exportarExpedientesExcel).mockReturnValue(promise);
    render(<ExportarExcelButton expedientes={EXPEDIENTES} columnas={COLUMNAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(screen.getByRole('button', { name: 'Generando...' })).toBeDisabled();

    resolve({ fallidos: 0 });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Excel' })).not.toBeDisabled());
  });

  it('muestra un aviso cuando quedan registros sin detalle de Plataforma', async () => {
    vi.mocked(exportarExpedientesExcel).mockResolvedValue({ fallidos: 2 });
    render(<ExportarExcelButton expedientes={EXPEDIENTES} columnas={COLUMNAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(await screen.findByText('2 registro(s) no se pudieron incluir en el detalle de Plataforma.')).toBeInTheDocument();
  });

  it('no muestra aviso cuando no hay fallidos', async () => {
    vi.mocked(exportarExpedientesExcel).mockResolvedValue({ fallidos: 0 });
    render(<ExportarExcelButton expedientes={EXPEDIENTES} columnas={COLUMNAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Excel' })).not.toBeDisabled());
    expect(screen.queryByText(/no se pudieron incluir/)).not.toBeInTheDocument();
  });

  it('el botón queda deshabilitado si no hay expedientes', () => {
    render(<ExportarExcelButton expedientes={[]} columnas={COLUMNAS} />);
    expect(screen.getByRole('button', { name: 'Exportar Excel' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- ExportarExcelButton`
Expected: FAIL — el componente actual llama a `exportarExpedientesCsv` de forma síncrona, nunca queda deshabilitado ni muestra "Generando...", y no existe ningún aviso de fallidos.

- [ ] **Step 3: Reescribir `ExportarExcelButton.tsx`**

Reemplazar el contenido completo de `src/components/tablero/ExportarExcelButton.tsx`:

```tsx
import { useState } from 'react';
import { exportarExpedientesExcel } from '@/utils/exportarExcel';
import type { ColumnaTabla, ExpedienteResumen } from '@/types/expediente.types';

interface ExportarExcelButtonProps {
  expedientes: ExpedienteResumen[] | undefined;
  columnas: ColumnaTabla[];
}

function IcoDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ExportarExcelButton({ expedientes, columnas }: ExportarExcelButtonProps) {
  const [generando, setGenerando] = useState(false);
  const [fallidos, setFallidos] = useState<number | null>(null);

  const sinDatos = !expedientes || expedientes.length === 0;
  const disabled = sinDatos || generando;

  const handleClick = async () => {
    if (sinDatos) return;
    setFallidos(null);
    setGenerando(true);
    try {
      const resultado = await exportarExpedientesExcel(expedientes, columnas);
      if (resultado.fallidos > 0) setFallidos(resultado.fallidos);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={sinDatos ? 'No hay trámites para exportar' : 'Descargar los trámites filtrados en Excel'}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm border border-surface-border bg-surface-panel px-3.5 py-2.5 text-[13px] font-medium text-ink-medium hover:border-accent hover:text-ink-strong disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-surface-border disabled:hover:text-ink-medium"
      >
        <IcoDownload />
        {generando ? 'Generando...' : 'Exportar Excel'}
      </button>
      {fallidos !== null && fallidos > 0 && (
        <p className="text-xs text-red-600">{fallidos} registro(s) no se pudieron incluir en el detalle de Plataforma.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test -- ExportarExcelButton`
Expected: PASS (4 tests).

- [ ] **Step 5: Eliminar el util CSV viejo**

```bash
git rm src/utils/exportarCsv.ts
```

- [ ] **Step 6: Verificar que no queda ninguna referencia al CSV viejo**

Run: `grep -rn "exportarCsv\|exportarExpedientesCsv" src/`
Expected: sin resultados.

- [ ] **Step 7: Correr el type-check y la suite completa de tests**

Run: `npm run type-check && npm test`
Expected: sin errores de tipos; todos los tests pasan (incluidos los de `Tablero` si existieran, que no deberían verse afectados porque la prop interface de `ExportarExcelButton` no cambió).

- [ ] **Step 8: Commit**

```bash
git add src/components/tablero/ExportarExcelButton.tsx src/components/tablero/ExportarExcelButton.test.tsx
git commit -m "feat(front): export Excel async con estado de carga y aviso de registros fallidos"
```

---

## Verificación manual final (no automatizable en el plan)

Después de completar las 5 tasks, antes de dar la feature por terminada:

1. Levantar el proyecto (`npm run dev`), ir al Tablero, aplicar algún filtro y hacer clic en "Exportar Excel".
2. Confirmar que el botón se deshabilita y muestra "Generando..." brevemente.
3. Abrir el `.xlsx` descargado (Excel/LibreOffice/Google Sheets) y confirmar:
   - 3 hojas: "Trámites", "Agenda", "Plataforma", en ese orden.
   - "Trámites" y "Agenda" tienen las mismas columnas/filas que las columnas tildadas en el selector del Tablero.
   - "Plataforma" tiene una fila por expediente con los campos de software/versión/DJ resumidas.
4. (Opcional, si es fácil de simular) Cortar la red o frenar el backend a mitad de la exportación para confirmar que se ve el aviso de "N registro(s) no se pudieron incluir...".
