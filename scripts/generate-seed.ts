import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPEDIENTES_MOCK } from '../src/mocks/data/expedientes.data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../renapdis-backend/src/main/resources/db/migration/V3__seed_expedientes.sql');

const q = (v: string | undefined | null) =>
  v === undefined || v === null || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const qNonNull = (v: string) => `'${String(v).replace(/'/g, "''")}'`; // para NOT NULL (permite string vacío como '')
const b = (v: boolean) => (v ? 'TRUE' : 'FALSE');
const d = (v: string) => `'${v}'`; // fechas ya vienen 'YYYY-MM-DD'

const lines: string[] = ['-- Generado por scripts/generate-seed.ts a partir del mock. No editar a mano.', ''];

EXPEDIENTES_MOCK.forEach((e, i) => {
  const id = i + 1;
  lines.push(
    `INSERT INTO expediente (id, expediente, estado, fecha_ingreso, ultima_modificacion, responsable, ` +
    `nombre_entidad, cuit_entidad, provincia, departamento, telefono, email, cuit_cuil_contacto, contacto, ` +
    `funcion_en_entidad, observacion_funcion_otra, naturaleza_entidad, referente_es_solicitante, referente_tecnico, ` +
    `tipo, responsable_tramite, nombre_software, version_produccion, modalidad_prescripcion, consume_refeps, ` +
    `url_sitio, estandar_interoperabilidad, imagen_receta, imagen_pantalla_prescripcion, acredita_personeria, ` +
    `certificado_inscripcion_bd, inscripcion_bd, observaciones) VALUES (` +
    `${id}, ${qNonNull(e.expediente)}, ${qNonNull(e.estado)}, ${d(e.fechaIngreso)}, ${d(e.ultimaModificacion)}, ` +
    `${qNonNull(e.responsable)}, ${qNonNull(e.nombreEntidad)}, ${qNonNull(e.cuitEntidad)}, ${qNonNull(e.provincia)}, ` +
    `${q(e.departamento)}, ${q(e.telefono)}, ${q(e.email)}, ${q(e.cuitCuilContacto)}, ${q(e.contacto)}, ` +
    `${q(e.funcionEnEntidad)}, ${q(e.observacionFuncionOtra)}, ${qNonNull(e.naturalezaEntidad)}, ${b(e.referenteEsSolicitante)}, ` +
    `${q(e.referenteTecnico)}, ${qNonNull(e.tipo)}, ${q(e.responsableTramite)}, ${q(e.nombreSoftware)}, ` +
    `${q(e.versionProduccion)}, ${q(e.modalidadPrescripcion)}, ${b(e.consumeREFEPS)}, ${q(e.urlSitio)}, ` +
    `${q(e.estandarInteroperabilidad)}, ${q(e.imagenReceta)}, ${q(e.imagenPantallaPrescripcion)}, ` +
    `${b(e.acreditaPersoneria)}, ${b(e.certificadoInscripcionBD)}, ${b(e.inscripcionBD)}, ${q(e.observaciones)});`
  );
  e.historial.forEach((h, j) => {
    lines.push(
      `INSERT INTO expediente_historial (expediente_id, orden, fecha, tipo_movimiento, usuario_origen, sector_origen, ` +
      `usuario_destino, sector_destino, motivo_pase, estado_en_ese_momento, numero_resolucion) VALUES (` +
      `${id}, ${j}, ${d(h.fecha)}, ${qNonNull(h.tipoMovimiento)}, ${q(h.usuarioOrigen)}, ${q(h.sectorOrigen)}, ` +
      `${q(h.usuarioDestino)}, ${q(h.sectorDestino)}, ${q(h.motivoPase)}, ${q(h.estadoEnEseMomento)}, ${q(h.numeroResolucion)});`
    );
  });
  e.declaracionesJuradas.forEach((dj, j) => {
    lines.push(
      `INSERT INTO expediente_declaracion_jurada (expediente_id, orden, clave, texto, valor) VALUES (` +
      `${id}, ${j}, ${qNonNull(dj.clave)}, ${qNonNull(dj.texto)}, ${b(dj.valor)});`
    );
  });
  lines.push('');
});

// Sincronizar la secuencia identity tras insertar ids explícitos.
lines.push(`SELECT setval(pg_get_serial_sequence('expediente','id'), (SELECT MAX(id) FROM expediente));`);

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`Escrito ${OUT} con ${EXPEDIENTES_MOCK.length} expedientes.`);
