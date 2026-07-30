import styles from './TabObservaciones.module.css';

export default function TabObservaciones({ expediente }) {
  const obs = expediente.observaciones;

  return (
    <div>
      <h2 className={styles.titulo}>Observaciones</h2>
      <hr className={styles.divisor} />

      {obs ? (
        <div className={styles.contenido}>{obs}</div>
      ) : (
        <div className={styles.vacio}>Sin observaciones registradas.</div>
      )}
    </div>
  );
}
