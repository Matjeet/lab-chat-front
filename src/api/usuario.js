import { API_BASE_URL } from './config';

/**
 * @typedef {Object} UsuarioResponse
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {(
 *   | { ok: true, data: UsuarioResponse }
 *   | { ok: false, error: { kind: 'no-autenticado' | 'prohibido' | 'no-encontrado' | 'servidor' | 'red' } }
 * )} ResultadoUsuario
 */

/**
 * Llama a `GET /api/v1/usuarios/{uid}` de chat-gateway (contrato §4.2) — el
 * único endpoint autenticado del sistema: exige `Authorization: Bearer
 * <idToken>` y el gateway comprueba él mismo que el uid que decodifica ese
 * token coincide con el `{uid}` pedido. Nunca lanza: resultado tipado,
 * igual que `src/api/registro.js`.
 *
 * @param {string} uid       UID de Firebase del usuario a consultar.
 * @param {string} idToken   Token de ID de Firebase de quien pregunta (debe ser el mismo `uid`).
 * @returns {Promise<ResultadoUsuario>}
 */
export const obtenerUsuario = async (uid, idToken) => {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/v1/usuarios/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    // Sin red, DNS, CORS, servicio caído...
    return { ok: false, error: { kind: 'red' } };
  }

  if (respuesta.ok) {
    return { ok: true, data: await respuesta.json() };
  }

  let problema = null;
  try {
    problema = await respuesta.json();
  } catch {
    /* cuerpo no-JSON o vacío */
  }

  switch (problema?.type) {
    case 'urn:problem-type:unauthorized':
      return { ok: false, error: { kind: 'no-autenticado' } };
    case 'urn:problem-type:forbidden':
      return { ok: false, error: { kind: 'prohibido' } };
    case 'urn:problem-type:resource-not-found':
      return { ok: false, error: { kind: 'no-encontrado' } };
    default:
      return { ok: false, error: { kind: 'servidor' } };
  }
};

/**
 * @typedef {Object} ExisteUsernameResponse
 * @property {boolean} existe
 */

/**
 * @typedef {(
 *   | { ok: true, data: ExisteUsernameResponse }
 *   | { ok: false, error: { kind: 'validacion', mensaje: string } }
 *   | { ok: false, error: { kind: 'no-autenticado' | 'servidor' | 'red' } }
 * )} ResultadoExisteUsuario
 */

/**
 * Llama a `GET /api/v1/usuarios/existe?username=` de chat-gateway (contrato
 * §4.6) — comprueba si ya hay una cuenta con ese `username`. A diferencia de
 * `obtenerUsuario` y de la lista de chats, **no compara identidad**: basta
 * cualquier `idToken` válido, no hace falta que sea la sesión de ese
 * `username` — pensado para preguntar por *otro* usuario antes de empezar
 * un chat con él, no para resolver los datos de la sesión actual (eso es
 * `obtenerUsuario`). Nunca lanza: resultado tipado, igual que el resto de
 * `src/api/`.
 *
 * @param {string} username
 * @param {string} idToken   idToken de Firebase de cualquier sesión activa.
 * @returns {Promise<ResultadoExisteUsuario>}
 */
export const existeUsuario = async (username, idToken) => {
  let respuesta;
  try {
    respuesta = await fetch(
      `${API_BASE_URL}/api/v1/usuarios/existe?username=${encodeURIComponent(username)}`,
      { headers: { Authorization: `Bearer ${idToken}` } },
    );
  } catch {
    // Sin red, DNS, CORS, servicio caído...
    return { ok: false, error: { kind: 'red' } };
  }

  if (respuesta.ok) {
    return { ok: true, data: await respuesta.json() };
  }

  let problema = null;
  try {
    problema = await respuesta.json();
  } catch {
    /* cuerpo no-JSON o vacío */
  }

  switch (problema?.type) {
    case 'urn:problem-type:validation-error':
      // Aquí el error es del propio parámetro `username` (este endpoint no
      // tiene cuerpo) — `errors[]` viene vacío y el mensaje real está en
      // `detail` (contrato §4.6), igual que el `cursor` de listaChats.js.
      return { ok: false, error: { kind: 'validacion', mensaje: problema.detail ?? '' } };
    case 'urn:problem-type:unauthorized':
      return { ok: false, error: { kind: 'no-autenticado' } };
    default:
      return { ok: false, error: { kind: 'servidor' } };
  }
};
