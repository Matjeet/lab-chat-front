import styles from './ItemChat.module.css';

/**
 * Átomo: un elemento de la lista de chats — con quién es la conversación y
 * su último mensaje.
 *
 * @param {object} props
 * @param {string} props.otroUsuario
 * @param {{contenido: string}} props.ultimoMensaje
 * @param {boolean} [props.activo=false]  Si es el chat abierto actualmente.
 * @param {() => void} props.onClick
 */
const ItemChat = ({ otroUsuario, ultimoMensaje, activo = false, onClick }) => (
  <li className={styles.fila}>
    <button
      type="button"
      className={`${styles.item} ${activo ? styles.activo : ''}`.trim()}
      onClick={onClick}
      aria-current={activo ? 'true' : undefined}
    >
      <p className={styles.nombre}>{otroUsuario}</p>
      <p className={styles.ultimoMensaje}>{ultimoMensaje.contenido}</p>
    </button>
  </li>
);

export default ItemChat;
