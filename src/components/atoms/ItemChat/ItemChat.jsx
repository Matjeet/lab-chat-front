import styles from './ItemChat.module.css';

/**
 * Átomo: un elemento de la lista de chats — con quién es la conversación y
 * su último mensaje.
 *
 * El avatar entra como `ReactNode` (slot), no como dato: un átomo no puede
 * importar otro átomo (`AvatarUsuario`), así que quien arma la fila
 * (`ListaChats`) decide qué pintar a la izquierda del nombre.
 *
 * @param {object} props
 * @param {string} props.otroUsuario
 * @param {{contenido: string}} props.ultimoMensaje
 * @param {React.ReactNode} [props.avatar]  A la izquierda del nombre y el último mensaje.
 * @param {boolean} [props.activo=false]  Si es el chat abierto actualmente.
 * @param {() => void} props.onClick
 */
const ItemChat = ({ otroUsuario, ultimoMensaje, avatar, activo = false, onClick }) => (
  <li className={styles.fila}>
    <button
      type="button"
      className={`${styles.item} ${activo ? styles.activo : ''}`.trim()}
      onClick={onClick}
      aria-current={activo ? 'true' : undefined}
    >
      {avatar && <span className={styles.avatar}>{avatar}</span>}
      <span className={styles.texto}>
        <p className={styles.nombre}>{otroUsuario}</p>
        <p className={styles.ultimoMensaje}>{ultimoMensaje.contenido}</p>
      </span>
    </button>
  </li>
);

export default ItemChat;
