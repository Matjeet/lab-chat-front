import { Blobatar } from '@blobatar/react';
import 'blobatar/motion.css'; // requisito de la propia librería: sin esto, `animate` no anima nada.

import {
  esEtiquetaBlobatar,
  opcionesBlobatar,
  parsearEtiquetaBlobatar,
} from '../../../utils/avatarBlobatar';
import styles from './AvatarUsuario.module.css';

// 36px — a propósito más grande que los 24px de los iconos de Notificaciones
// y ThemeToggle: a ese tamaño chico, igualado con esos dos, la cara del
// avatar (forma + ojos) se veía demasiado pequeña para distinguirse. No hay
// token de `tokens.css` para este número exacto (no es parte de la escala de
// espaciado); queda como constante con este comentario, igual que el resto
// de literales específicos de un componente en este mismo código base (ver
// p. ej. el ancho fijo del panel en `AvatarPersonalizable.module.css`).
const TAMANO_PX = 36;

/**
 * Átomo: el avatar de un usuario — el de la sesión activa en la cabecera
 * (slot `headerAvatar` de `DefaultLayout`, ver `HomePage`, al extremo
 * derecho tras `ThemeToggle`) y el de cada persona en `ListaChats`. `avatar`
 * es el mismo valor que devuelven `GET /api/v1/usuarios/{uid}` (contrato
 * §4.2) y cada `ChatResumen` de la lista de chats (§4.5): un enlace
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
 * Deliberadamente más grande que los iconos de `Notificaciones`/`ThemeToggle`
 * (36px vs. 24px, ver {@link TAMANO_PX}): igualado a ese tamaño se veía
 * demasiado pequeño para distinguir la cara del avatar — un avatar más
 * grande que los iconos de acción vecinos es además el patrón habitual en
 * una cabecera con foto de perfil.
 *
 * `animate="hover"`, no `"always"` como en `AvatarPersonalizable`: ahí es
 * la pieza central de la pantalla de registro; aquí es un icono más de la
 * cabecera o de una fila de la lista de chats, siempre visible — animarlo
 * sin parar (con decenas de filas, además) sería ruido constante, no un
 * detalle; blobatar recomienda `"hover"` justo para listas.
 *
 * @param {object} props
 * @param {string|null} [props.avatar]
 * @param {string} [props.username='']
 */
const AvatarUsuario = ({ avatar, username = '' }) => {
  if (!avatar && !username) return null;

  if (avatar && !esEtiquetaBlobatar(avatar)) {
    return (
      <span className={styles.contenedor}>
        <img src={avatar} alt="" className={styles.imagen} />
      </span>
    );
  }

  const personalizacion = avatar ? parsearEtiquetaBlobatar(avatar) : { name: username };
  const nombre = personalizacion.name || username;

  return (
    <span className={styles.contenedor}>
      <Blobatar
        name={nombre}
        size={TAMANO_PX}
        title={nombre ? `Avatar de ${nombre}` : undefined}
        animate="hover"
        {...opcionesBlobatar(personalizacion)}
      />
    </span>
  );
};

export default AvatarUsuario;
