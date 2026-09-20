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
