import { useState, useRef, useEffect } from 'react';
import styles from './SelectorColumnas.module.css';

function IcoColumnas() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

/**
 * Selector de columnas visibles de la tabla.
 * Props:
 *  - columnas: catálogo completo [{ key, label }]
 *  - visibles: array de keys visibles
 *  - onToggle(key): alterna una columna
 *  - onReset(): vuelve al set por defecto
 */
export default function SelectorColumnas({ columnas, visibles, onToggle, onReset }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const onClickFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', onClickFuera);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickFuera);
      document.removeEventListener('keydown', onEsc);
    };
  }, [abierto]);

  const visiblesSet = new Set(visibles);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.boton}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        <IcoColumnas />
        Columnas
        <span className={styles.contador}>{visibles.length}</span>
      </button>

      {abierto && (
        <div className={styles.panel} role="menu">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitulo}>Columnas visibles</span>
            <button type="button" className={styles.reset} onClick={onReset}>
              Restablecer
            </button>
          </div>
          <div className={styles.lista}>
            {columnas.map((col) => (
              <label key={col.key} className={styles.item}>
                <input
                  type="checkbox"
                  checked={visiblesSet.has(col.key)}
                  onChange={() => onToggle(col.key)}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
