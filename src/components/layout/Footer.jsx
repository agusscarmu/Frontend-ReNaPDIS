import { TEXTOS } from '@/config/constantes.js';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.accent} />
      <div className={styles.marca}>{TEXTOS.appNombre}</div>
      <div className={styles.etapa}>Etapa 1 — Prototipo (solo lectura)</div>
    </footer>
  );
}
