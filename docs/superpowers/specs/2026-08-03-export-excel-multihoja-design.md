# Exportación a Excel multi-hoja (Agenda + Plataforma) — Diseño

Fecha: 2026-08-03

## Contexto

- El botón "Exportar Excel" del Tablero (`src/components/tablero/ExportarExcelButton.tsx`)
  hoy genera en realidad un **CSV** (`src/utils/exportarCsv.ts`): un blob de texto
  delimitado por `;` con BOM UTF-8, descargado con extensión `.csv`. No hay ninguna
  librería de generación de Excel (`xlsx`/`exceljs`) en `package.json`.
- El CSV es un formato plano de una sola tabla: no soporta el concepto de "hojas", por lo
  que no puede extenderse in place para el pedido de múltiples hojas.
- El Tablero (`src/pages/Tablero.tsx`) solo tiene en memoria `ExpedienteResumen[]`
  (`listarExpedientes()` → `GET /expedientes`), que cubre los campos tipo "Agenda"
  (entidad, contacto, gestión interna) pero **no** los campos de Plataforma (software,
  versión, declaraciones juradas, etc.), que solo existen en el detalle completo
  (`Expediente`, vía `obtenerExpediente(id)` → `GET /expedientes/:id`).
- `COLUMNAS_TABLA` (`src/components/tablero/columnas.config.tsx`) ya está documentado como
  "Basado en la hoja Agenda del Excel [legacy]" — el listado actual del Tablero mapea
  conceptualmente a esa hoja.

## Decisiones

1. **Formato real de Excel:** se incorpora la librería `xlsx` (SheetJS) como dependencia
   nueva. Es la opción estándar para generar workbooks multi-hoja en el browser sin
   backend, liviana, sin necesidad de estilos/formato avanzado (no pedido). Se descarta
   `exceljs` por ser más pesada y pensada para casos con formato/estilo complejo.
2. **Datos de Plataforma:** se obtienen pidiendo el detalle completo (`obtenerExpediente`)
   de cada expediente filtrado en el momento de exportar, con concurrencia limitada. No se
   requiere cambio de backend/API para esta primera versión.
3. **Columnas de la hoja "Agenda":** las mismas columnas visibles/tildadas que ya usa la
   hoja principal (respeta la selección de columnas del usuario en el Tablero), no un set
   fijo independiente.
4. **Declaraciones juradas en "Plataforma":** una fila por expediente; las declaraciones
   juradas se resumen concatenadas en una sola celda (no una columna por clave).
5. **Feedback de carga:** el botón se deshabilita y cambia su texto a "Generando..." mientras
   se arma el archivo (sin barra de progreso).
6. **Manejo de errores parciales:** si falla el detalle de algún expediente puntual, la
   exportación continúa sin ese registro en la hoja "Plataforma" (las hojas "Trámites" y
   "Agenda" no se ven afectadas); al finalizar se muestra un aviso inline junto al botón
   indicando cuántos registros no se pudieron completar. No existe sistema de toasts en el
   proyecto (confirmado por búsqueda en `src/`); se sigue el patrón inline ya usado en
   `src/pages/Login.tsx` (estado de error renderizado como texto junto al control).
7. **Alcance:** solo se tocan `ExportarExcelButton.tsx` y el util de export. No se agrega
   una cuarta hoja de historial (`MovimientoHistorial`) ni cambios de backend en esta
   iteración.

## Diseño

### 1. Dependencia nueva

`npm install xlsx` (SheetJS community edition). Se usa para construir un
`XLSX.WorkBook` con `XLSX.utils.book_new()` / `aoa_to_sheet` (o `json_to_sheet`) /
`book_append_sheet`, y disparar la descarga con `XLSX.writeFile(wb, nombreArchivo)`.

### 2. Reemplazo del util de export

- Se elimina `src/utils/exportarCsv.ts`.
- Se crea `src/utils/exportarExcel.ts` con:
  ```ts
  export async function exportarExpedientesExcel(
    expedientes: ExpedienteResumen[],
    columnas: ColumnaTabla[],
    nombreArchivo = 'tramites',
  ): Promise<{ fallidos: number }>
  ```
  Responsable de:
  1. Pedir el detalle (`obtenerExpediente`) de cada expediente en `expedientes`, con
     concurrencia limitada (pool de 5 en paralelo), usando `Promise.allSettled` por lote.
  2. Armar las 3 hojas (ver sección 3).
  3. Generar el workbook y disparar la descarga como
     `${nombreArchivo}_YYYY-MM-DD.xlsx` (mismo patrón de nombre que hoy, extensión nueva).
  4. Devolver la cantidad de expedientes cuyo detalle falló, para que el botón muestre el
     aviso correspondiente.

### 3. Hojas del workbook

1. **"Trámites"** (hoja principal, comportamiento sin cambios): filas = `expedientes`
   filtrados del Tablero, columnas = `columnas` (las visibles/tildadas), igual lógica de
   `valorCelda`/`exportValue` que ya existe hoy en `exportarCsv.ts` (se traslada tal cual).
2. **"Agenda"**: mismas filas y mismas `columnas` que la hoja "Trámites".
3. **"Plataforma"**: una fila por expediente cuyo detalle se haya podido obtener, con las
   columnas:
   - Expediente
   - Entidad (`nombreEntidad`)
   - Tipo (`tipo`)
   - Software (`nombreSoftware`)
   - Versión en producción (`versionProduccion`)
   - Modalidad de prescripción (`modalidadPrescripcion`)
   - Consume REFEPS (`consumeREFEPS` → Sí/No)
   - Estándar de interoperabilidad (`estandarInteroperabilidad`)
   - URL del servicio (`urlSitio`)
   - Declaraciones juradas (resumen de `declaracionesJuradas`: cada elemento como
     `"{texto}: {Sí|No}"`, unidos con `"; "`)
   - Acredita personería (`acreditaPersoneria` → Sí/No)
   - Certificado de inscripción BD (`certificadoInscripcionBD` → Sí/No)
   - Registro de bases de datos (`inscripcionBD` → Sí/No)
   - Imagen de receta adjunta (`!!imagenReceta` → Sí/No)
   - Imagen de pantalla de prescripción adjunta (`!!imagenPantallaPrescripcion` → Sí/No)

### 4. `ExportarExcelButton.tsx`

- Pasa a manejar estado local `generando: boolean` y `avisoFallidos: number | null`.
- `handleClick` se vuelve async: setea `generando = true`, llama a
  `exportarExpedientesExcel(...)`, al resolver setea `avisoFallidos` si `fallidos > 0`, y
  siempre vuelve a `generando = false` en un `finally`.
- Mientras `generando`, el botón queda `disabled` y su texto cambia a "Generando...".
- Si `avisoFallidos` tiene valor, se renderiza un texto inline junto al botón (mismo
  patrón que `Login.tsx`): `"{n} registro(s) no se pudieron incluir en el detalle de
  Plataforma."`, que se limpia en el próximo click.

### 5. Fuera de alcance

- No se agrega barra de progreso numérica.
- No se agrega hoja de historial de movimientos.
- No se cambia el endpoint `/expedientes` ni se pide al backend enriquecer el listado.
- No se agrega sistema de toasts al proyecto.

## Testing

- Tests unitarios para `exportarExpedientesExcel` (Vitest), mockeando `obtenerExpediente`
  vía MSW (ya usado en el proyecto) o mock directo del módulo `api/expedientes.api.ts`:
  - Genera 3 hojas con los nombres esperados.
  - Hoja "Plataforma" excluye correctamente un expediente cuyo detalle falla, y la función
    devuelve `fallidos = 1`.
  - Resumen de declaraciones juradas se concatena en el formato esperado.
  - Columnas de "Agenda" coinciden con las columnas pasadas (respeta selección).
- Test de componente para `ExportarExcelButton`: durante la exportación el botón se
  deshabilita y muestra "Generando..."; si `exportarExpedientesExcel` resuelve con
  `fallidos > 0`, se renderiza el aviso inline.
