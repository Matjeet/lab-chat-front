import { Blobatar } from '@blobatar/react';
import 'blobatar/motion.css'; // requisito de la propia librería: sin esto, `animate` no anima nada.

import {
  esEtiquetaBlobatar,
  opcionesBlobatar,
  parsearEtiquetaBlobatar,
} from '../../../utils/avatarBlobatar';
import styles from './AvatarUsuario.module.css';

const TAMANO_PX = 28;

/**
 * Átomo: el avatar de la sesión activa, en la cabecera (a la izquierda de
 * `ThemeToggle` — ver `HomePage`). `avatar` es el mismo valor que devuelve
 * `GET /api/v1/usuarios/{uid}` (chat-gateway, contrato §4.2): un enlace
 * `http(s)`, una etiqueta `<Blobatar .../>` (la forma que genera este mismo
 * frontend al registrarse, ver `AvatarPersonalizable`/
 * `src/utils/avatarBlobatar.js`), o `null` si la cuenta no tiene uno
 * (nunca pasa para una cuenta creada por este frontend, que siempre manda
 * algo al registrarse — sí podría pasar para una cuenta de otro origen).
 *
 * Sin `avatar` (`null`), cae al mismo automático que ve quien se registra
 * antes de personalizar nada: `<Blobatar name={username} />`. Sin
 * `username` tampoco (todavía no se resolvió "tu usuario"), no pinta nada —
 * mejor vacío un instante que un relleno que enseguida cambia.
 *
 * `animate="hover"`, no `"always"` como en `AvatarPersonalizable`: ahí es
 * la pieza central de la pantalla de registro; aquí es un icono más de la
 * cabecera, siempre visible — animarlo sin parar sería ruido constante, no
 * un detalle.
 *
 * @param {object} props
 * @param {string|null} [props.avatar]
 * @param {string} [props.username='']
 */
const AvatarUsuario = ({ avatar, username = '' }) => {
  if (!avatar && !username) return null;

  if (avatar && !esEtiquetaBlobatar(avatar)) {
    return <img src={avatar} alt="" className={styles.imagen} />;
  }

  const personalizacion = avatar ? parsearEtiquetaBlobatar(avatar) : { name: username };
  const nombre = personalizacion.name || username;

  return (
    <Blobatar
      name={nombre}
      size={TAMANO_PX}
      title={nombre ? `Avatar de ${nombre}` : undefined}
      animate="hover"
      {...opcionesBlobatar(personalizacion)}
    />
  );
};

export default AvatarUsuario;
