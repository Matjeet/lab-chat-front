/**
 * Recuerda, solo en este navegador, el username de chat-registro de quien
 * usa la app — para la pantalla de chat (`ChatPage`), que todavía no tiene
 * ninguna forma de resolverlo a partir de la sesión de Firebase (no hay
 * endpoint en chat-registro para eso; ver `docs/integracion-conversacion.md`).
 * Tolerante a fallos (modo incógnito, almacenamiento deshabilitado...).
 */
const CLAVE = 'chat:miUsuario';

/** @returns {string} El username guardado, o cadena vacía si no hay ninguno. */
export const leerMiUsuario = () => {
  try {
    return localStorage.getItem(CLAVE) ?? '';
  } catch {
    return '';
  }
};

/** @param {string} usuario */
export const guardarMiUsuario = (usuario) => {
  try {
    localStorage.setItem(CLAVE, usuario);
  } catch {
    /* almacenamiento no disponible: solo dura esta sesión */
  }
};
