import styles from './ItemNotificacion.module.css';

const TEXTO_POR_TIPO = {
  solicitud: (remitente) => `${remitente} te envió una solicitud de chat`,
};

const formatearFecha = (iso) => new Date(iso).toLocaleString();

/**
 * Átomo: un elemento del panel de notificaciones (`Notificaciones`).
 *
 * El texto se arma a partir de `tipo` (el backend no manda uno ya redactado —
 * ver `notificacion.remitente` en `src/notificaciones/notificaciones.js`); hoy
 * solo existe `"solicitud"`, que además muestra dos botones de icono
 * (aceptar/rechazar) — cualquier otro `tipo` se queda sin acciones propias,
 * solo con las de leída/no leída.
 *
 * "Leída" se controla desde fuera: pasar el mouse por encima de una
 * notificación sin leer llama a `onMarcarLeida` (aquí, no en `Notificaciones`,
 * porque es el propio elemento quien sabe cuándo el mouse entra); una ya
 * leída muestra un botón para devolverla a "no leída" (`onMarcarNoLeida`).
 *
 * @param {object} props
 * @param {import('../../../notificaciones/notificaciones').Notificacion} props.notificacion
 * @param {() => void} props.onMarcarLeida
 * @param {() => void} props.onMarcarNoLeida
 * @param {() => void} [props.onAceptar]   Solo se usa si `tipo === 'solicitud'`.
 * @param {() => void} [props.onRechazar]  Solo se usa si `tipo === 'solicitud'`.
 */
const ItemNotificacion = ({ notificacion, onMarcarLeida, onMarcarNoLeida, onAceptar, onRechazar }) => {
  const { remitente, tipo, leida, createdAt } = notificacion;
  const texto = TEXTO_POR_TIPO[tipo]?.(remitente) ?? 'Tienes una notificación nueva';
  const esSolicitud = tipo === 'solicitud' && Boolean(remitente);

  return (
    <li
      className={`${styles.item} ${leida ? '' : styles.noLeida}`.trim()}
      onMouseEnter={() => {
        if (!leida) onMarcarLeida();
      }}
    >
      <div className={styles.contenido}>
        <p className={styles.texto}>{texto}</p>
        <time className={styles.fecha} dateTime={createdAt}>
          {formatearFecha(createdAt)}
        </time>
      </div>
      <div className={styles.acciones}>
        {esSolicitud && (
          <>
            <button
              type="button"
              className={`${styles.botonIcono} ${styles.aceptar}`}
              aria-label={`Aceptar solicitud de ${remitente}`}
              onClick={onAceptar}
            >
              <span aria-hidden="true">✓</span>
            </button>
            <button
              type="button"
              className={`${styles.botonIcono} ${styles.rechazar}`}
              aria-label={`Rechazar solicitud de ${remitente}`}
              onClick={onRechazar}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </>
        )}
        {leida && (
          <button
            type="button"
            className={styles.botonIcono}
            aria-label="Marcar como no leída"
            onClick={onMarcarNoLeida}
          >
            <span aria-hidden="true">●</span>
          </button>
        )}
      </div>
    </li>
  );
};

export default ItemNotificacion;
