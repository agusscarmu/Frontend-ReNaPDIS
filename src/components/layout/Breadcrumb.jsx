import { useNavigate } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

function IcoHome() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export default function Breadcrumb({ items }) {
  const navigate = useNavigate();
  return (
    <nav className={styles.crumb} aria-label="Ruta de navegación">
      <span className={styles.home}><IcoHome /></span>
      {items.map((it, i) => (
        <span key={i} className={styles.item}>
          <span className={styles.sep}>/</span>
          {it.to ? (
            <button className={styles.link} onClick={() => navigate(it.to)}>{it.label}</button>
          ) : (
            <span className={styles.current}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
