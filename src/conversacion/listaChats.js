import { API_BASE_URL } from '../api/config';

/**
 * @typedef {Object} ChatResumen
 * @property {string} otroUsuario
 * @property {import('./historial').Mensaje} ultimoMensaje
 */

/**
 * @typedef {Object} PaginaChats
 * @property {ChatResumen[]} content
 * @property {string} nextCursor  Vacío cuando `hasMore` es `false` — no se reenvía en ese caso.
 * @property {boolean} hasMore
 */

/**
 * @typedef {(
 *   | { ok: true, data: PaginaChats }
 *   | { ok: false, error: { kind: 'cursor-invalido', mensaje: string } }
 *   | { ok: false, error: { kind: 'no-autenticado' | 'prohibido' | 'no-encontrado' | 'servidor' | 'red' } }
 * )} ResultadoListaChats
 */

/**
 * Llama a `GET /api/v1/conversaciones/{usuario}/chats` de chat-gateway (contrato §4.5) —
 * junto con `GET /api/v1/usuarios/{uid}` (`src/api/usuario.js`), el único otro endpoint
 * autenticado del sistema. Un resumen por cada persona con quien `usuario` tiene al menos un
 * mensaje, con el último mensaje de esa conversación, más reciente primero.
 *
 * Paginado por **cursor**, no por página/offset (el orden cambia con cada mensaje nuevo, un
 * offset se desincroniza): `opciones.cursor` debe ser el `nextCursor` de una página anterior
 * tal cual, sin parsearlo — es opaco. Nunca lanza: resultado tipado, igual que el resto de
 * `src/api/` y `src/conversacion/`.
 *
 * @param {string} usuario  username de chat-registro cuyos chats se piden.
 * @param {string} idToken  idToken de Firebase de la sesión activa — debe ser el dueño de `usuario`.
 * @param {{cursor?: string, size?: number}} [opciones]
 * @returns {Promise<ResultadoListaChats>}
 */
export const obtenerListaChats = async (usuario, idToken, opciones = {}) => {
  const params = new URLSearchParams();
  if (opciones.cursor) params.set('cursor', opciones.cursor);
  if (opciones.size != null) params.set('size', opciones.size);
  const query = params.toString();

  let respuesta;
  try {
    respuesta = await fetch(
      `${API_BASE_URL}/api/v1/conversaciones/${encodeURIComponent(usuario)}/chats${query ? `?${query}` : ''}`,
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
      // Aquí el error es del propio parámetro `cursor`, no de un campo del cuerpo —
      // `errors[]` viene vacío y el mensaje real está en `detail` (contrato §4.5).
      return { ok: false, error: { kind: 'cursor-invalido', mensaje: problema.detail ?? '' } };
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
