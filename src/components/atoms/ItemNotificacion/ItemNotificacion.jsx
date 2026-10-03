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
 * solo existe `"solicitud"`, que además trae `meta: { aceptada, pendiente }`
 * (ya parseado, ver `src/notificaciones/notificaciones.js`) — mientras
 * `pendiente` sea `true`, muestra los botones de aceptar/rechazar; en cuanto
 * deja de estarlo, los sustituye por un texto de solo lectura: verde
 * "Aceptada" si `aceptada` es `true`, rojo "Rechazada" si es `false`. Sin
 * `meta` (`null` — no debería pasar para una solicitud real, pero es el
 * valor por defecto si el backend no la manda o el JSON no se pudo
 * parsear), se asume pendiente, igual que antes de que existiera `meta`.
 * Cualquier otro `tipo` se queda sin acciones propias, solo con las de
 * leída/no leída.
 *
 * "Leída" se controla desde fuera: pasar el mouse por encima de una
 * notificación sin leer llama a `onMarcarLeida` (aquí, no en `Notificaciones`,
 * porque es el propio elemento quien sabe cuándo el mouse entra); una ya
 * leída muestra un botón para devolverla a "no leída" (`onMarcarNoLeida`).
 *
 * @param {object} props
 * @param {import('../../../notificaciones/notificaciones').Notificacion} props.notificacion
 * @param {React.ReactNode} [props.avatar]  A la izquierda del texto (slot, no dato: un átomo no
 *   puede importar otro átomo — `AvatarUsuario` lo arma `Notificaciones`).
 * @param {() => void} props.onMarcarLeida
 * @param {() => void} props.onMarcarNoLeida
 * @param {() => void} [props.onAceptar]   Solo se usa si `tipo === 'solicitud'` y sigue pendiente.
 * @param {() => void} [props.onRechazar]  Solo se usa si `tipo === 'solicitud'` y sigue pendiente.
 * @param {boolean} [props.deshabilitado=false]  Desactiva los botones de acción (aceptar,
 *   rechazar, marcar no leída) mientras `Notificaciones` está esperando la respuesta de
 *   aceptar/rechazar esta notificación — evita un doble envío.
 */
const ItemNotificacion = ({
  notificacion,
  avatar,
  onMarcarLeida,
  onMarcarNoLeida,
  onAceptar,
  onRechazar,
  deshabilitado = false,
}) => {
  const { remitente, tipo, leida, createdAt, meta } = notificacion;
  const texto = TEXTO_POR_TIPO[tipo]?.(remitente) ?? 'Tienes una notificación nueva';
  const esSolicitud = tipo === 'solicitud' && Boolean(remitente);
  const pendiente = meta?.pendiente ?? true;
  const aceptada = meta?.aceptada ?? false;

  return (
    <li
      className={`${styles.item} ${leida ? '' : styles.noLeida}`.trim()}
      onMouseEnter={() => {
        if (!leida) onMarcarLeida();
      }}
    >
      {avatar && <span className={styles.avatar}>{avatar}</span>}
      <div className={styles.contenido}>
        <p className={styles.texto}>{texto}</p>
        <time className={styles.fecha} dateTime={createdAt}>
          {formatearFecha(createdAt)}
        </time>
      </div>
      <div className={styles.acciones}>
        {esSolicitud && pendiente && (
          <>
            <button
              type="button"
              className={`${styles.botonIcono} ${styles.aceptar}`}
              aria-label={`Aceptar solicitud de ${remitente}`}
              onClick={onAceptar}
              disabled={deshabilitado}
            >
              <span aria-hidden="true">✓</span>
            </button>
            <button
              type="button"
              className={`${styles.botonIcono} ${styles.rechazar}`}
              aria-label={`Rechazar solicitud de ${remitente}`}
              onClick={onRechazar}
              disabled={deshabilitado}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </>
        )}
        {esSolicitud && !pendiente && (
          <span className={aceptada ? styles.estadoAceptada : styles.estadoRechazada}>
            {aceptada ? 'Aceptada' : 'Rechazada'}
          </span>
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
