import styles from './CampoLectura.module.css';

export default function CampoLectura({ label, valor }) {
  const vacio = valor === null || valor === undefined || valor === '';
  return (
    <div className={styles.campo}>
      <span className={styles.label}>{label}</span>
      <span className={styles.valor}>{vacio ? '—' : String(valor)}</span>
    </div>
  );
}
