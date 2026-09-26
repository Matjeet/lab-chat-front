import { API_BASE_URL } from '../api/config';

/**
 * @typedef {Object} Notificacion
 * @property {number} id
 * @property {string|null} remitente  Username de quien la originó. `null` si el tipo no tiene remitente.
 * @property {string} tipo  Hoy solo `"solicitud"`.
 * @property {boolean} leida
 * @property {string} createdAt  ISO-8601 UTC.
 */

/**
 * @typedef {Object} PaginaNotificaciones
 * @property {Notificacion[]} content
 * @property {number} page
 * @property {number} size
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} first
 * @property {boolean} last
 * @property {boolean} empty
 */

/**
 * @typedef {(
 *   | { ok: true, data: PaginaNotificaciones }
 *   | { ok: false, error: { kind: 'no-autenticado' | 'prohibido' | 'servidor' | 'red' } }
 * )} ResultadoNotificaciones
 */

/**
 * Llama a `GET /api/v1/notificaciones/{receptor}` de chat-gateway (contrato §4.8): las
 * notificaciones de `receptor`, paginadas por página/offset (no por cursor, a diferencia de la
 * lista de chats), más reciente primero por defecto. Mismo mecanismo de autenticación que
 * `obtenerListaChats`: `receptor` debe ser el username del dueño de `idToken`, comparado por el
 * propio gateway. Nunca lanza: resultado tipado, igual que el resto de `src/api/` y
 * `src/conversacion/`.
 *
 * @param {string} receptor  username de chat-registro cuyas notificaciones se piden.
 * @param {string} idToken   idToken de Firebase de la sesión activa — debe ser el dueño de `receptor`.
 * @param {{page?: number, size?: number, sort?: string}} [opciones]
 * @returns {Promise<ResultadoNotificaciones>}
 */
export const obtenerNotificaciones = async (receptor, idToken, opciones = {}) => {
  const params = new URLSearchParams();
  if (opciones.page != null) params.set('page', opciones.page);
  if (opciones.size != null) params.set('size', opciones.size);
  if (opciones.sort) params.set('sort', opciones.sort);
  const query = params.toString();

  let respuesta;
  try {
    respuesta = await fetch(
      `${API_BASE_URL}/api/v1/notificaciones/${encodeURIComponent(receptor)}${query ? `?${query}` : ''}`,
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
    case 'urn:problem-type:unauthorized':
      return { ok: false, error: { kind: 'no-autenticado' } };
    case 'urn:problem-type:forbidden':
      return { ok: false, error: { kind: 'prohibido' } };
    default:
      return { ok: false, error: { kind: 'servidor' } };
  }
};

/**
 * @typedef {(
 *   | { ok: true, data: Notificacion }
 *   | { ok: false, error: { kind: 'validacion' | 'no-autenticado' | 'prohibido' | 'no-encontrado' | 'servidor' | 'red' } }
 * )} ResultadoActualizarLeida
 */

/**
 * Llama a `PATCH /api/v1/notificaciones/{id}` de chat-gateway (contrato §4.9): marca una
 * notificación como leída o no leída. A diferencia del resto de endpoints autenticados,
 * `uid` (Firebase, no `username`) se compara **directamente** contra el uid del `idToken` — debe
 * ser el mismo, o el gateway responde `prohibido` sin llegar a chat-notificaciones. Nunca lanza:
 * resultado tipado, igual que el resto de `src/api/` y `src/conversacion/`.
 *
 * @param {number} id
 * @param {string} uid      uid de Firebase de la sesión activa (debe ser el mismo `idToken`).
 * @param {boolean} leida
 * @param {string} idToken
 * @returns {Promise<ResultadoActualizarLeida>}
 */
export const actualizarLeida = async (id, uid, leida, idToken) => {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/v1/notificaciones/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ uid, leida }),
    });
  } catch {
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
      return { ok: false, error: { kind: 'validacion' } };
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
