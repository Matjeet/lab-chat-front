import styles from './BurbujaMensaje.module.css';

/**
 * Átomo: una burbuja de mensaje de chat.
 *
 * @param {object} props
 * @param {string} props.contenido
 * @param {string} props.enviadoEn  ISO-8601 UTC (contrato chat-conversacion §2.3).
 * @param {boolean} [props.propio=false]  Si lo mandó el usuario actual —
 *   se alinea a la derecha y usa el color de marca; el del interlocutor
 *   queda a la izquierda, en superficie neutra.
 */
const BurbujaMensaje = ({ contenido, enviadoEn, propio = false }) => {
  const hora = new Date(enviadoEn).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li className={`${styles.fila} ${propio ? styles.propio : ''}`.trim()}>
      <div className={styles.burbuja}>
        <p className={styles.contenido}>{contenido}</p>
        <time className={styles.hora} dateTime={enviadoEn}>
          {hora}
        </time>
      </div>
    </li>
  );
};

export default BurbujaMensaje;
