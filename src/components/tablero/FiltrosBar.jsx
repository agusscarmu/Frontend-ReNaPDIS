import { ESTADOS_LIST } from '@/domain/estados.js';
import { PROVINCIAS } from '@/domain/tipos.js';
import styles from './FiltrosBar.module.css';

function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icoSearch}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function FiltrosBar({ filtros, onChange, onLimpiar, responsables }) {
  const handleChange = (campo) => (e) => onChange({ ...filtros, [campo]: e.target.value });

  return (
    <div className={styles.card}>
      <div className={styles.fila}>
        <div className={styles.campoBusqueda}>
          <span className={styles.icoWrapper}>
            <IcoSearch />
          </span>
          <input
            type="text"
            placeholder="Buscar por expediente, entidad o CUIT..."
            value={filtros.busqueda ?? ''}
            onChange={handleChange('busqueda')}
            className={styles.inputBusqueda}
            aria-label="Buscar"
          />
        </div>

        <div className={styles.campoSelect}>
          <select value={filtros.estado ?? ''} onChange={handleChange('estado')} className={styles.select} aria-label="Estado">
            <option value="">Estado (Todos)</option>
            {ESTADOS_LIST.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className={styles.campoSelect}>
          <select value={filtros.provincia ?? ''} onChange={handleChange('provincia')} className={styles.select} aria-label="Provincia">
            <option value="">Provincia</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className={styles.campoSelect}>
          <select value={filtros.responsable ?? ''} onChange={handleChange('responsable')} className={styles.select} aria-label="Responsable">
            <option value="">Responsable</option>
            {(responsables ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className={styles.acciones}>
          <button type="button" onClick={onLimpiar} className={styles.btnLimpiar}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
