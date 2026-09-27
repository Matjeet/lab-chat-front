import { API_BASE_URL } from '../api/config';

/**
 * @typedef {Object} SolicitudChat
 * @property {string} id
 * @property {string} solicitante
 * @property {string} solicitado
 * @property {boolean} aceptada  Solo tiene sentido cuando `pendiente` es `false` — mientras está
 *   pendiente, es siempre `false` (nace así, todavía sin resolver).
 * @property {string} creadaEn
 * @property {boolean} pendiente  `true` mientras nadie la haya aceptado o rechazado
 *   (`actualizarSolicitud`, más abajo). Mientras sea `true`, bloquea una solicitud nueva entre
 *   el mismo par de usuarios — de ahí el `kind: 'duplicada'` de `crearSolicitud`.
 */

/**
 * @typedef {(
 *   | { ok: true, data: SolicitudChat }
 *   | { ok: false, error: { kind: 'validacion', mensaje: string } }
 *   | { ok: false, error: { kind: 'no-autenticado' | 'prohibido' | 'no-encontrado' | 'duplicada' | 'servidor' | 'red' } }
 * )} ResultadoCrearSolicitud
 */

/**
 * Llama a `POST /api/v1/conversaciones/solicitudes` de chat-gateway: crea una
 * solicitud de chat de `solicitante` hacia `solicitado`, paso previo
 * obligatorio para poder chatear con alguien — a diferencia del flujo
 * anterior, elegir un interlocutor nuevo desde la cabecera ya no abre la
 * conversación directamente (ver `docs/integracion-conversacion.md`).
 * `solicitante` debe ser el username del dueño de `idToken`: el gateway lo
 * comprueba él mismo y devuelve `prohibido` si no coincide. `duplicada`
 * (409) solo ocurre si ya hay una solicitud **pendiente** entre ambos
 * usuarios, en cualquier sentido — una ya resuelta (ver `actualizarSolicitud`
 * más abajo) no bloquearía una nueva. Nunca lanza: resultado tipado, igual
 * que el resto de `src/api/` y `src/conversacion/`.
 *
 * @param {string} solicitante  username de chat-registro de quien inicia la solicitud.
 * @param {string} solicitado   username de chat-registro de quien la recibe.
 * @param {string} idToken      idToken de Firebase de la sesión activa — debe ser el dueño de `solicitante`.
 * @returns {Promise<ResultadoCrearSolicitud>}
 */
export const crearSolicitud = async (solicitante, solicitado, idToken) => {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/v1/conversaciones/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ solicitante, solicitado }),
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
    case 'urn:problem-type:validation-error':
      // Aquí también cubre "solicitante y solicitado son el mismo usuario"
      // (400 sin errors[] de campo, el mensaje real va en detail) — mismo
      // criterio que el cursor de listaChats.js y el username de existe.
      return { ok: false, error: { kind: 'validacion', mensaje: problema.detail ?? '' } };
    case 'urn:problem-type:unauthorized':
      return { ok: false, error: { kind: 'no-autenticado' } };
    case 'urn:problem-type:forbidden':
      return { ok: false, error: { kind: 'prohibido' } };
    case 'urn:problem-type:resource-not-found':
      return { ok: false, error: { kind: 'no-encontrado' } };
    case 'urn:problem-type:duplicate-resource':
      return { ok: false, error: { kind: 'duplicada' } };
    default:
      return { ok: false, error: { kind: 'servidor' } };
  }
};

/**
 * @typedef {(
 *   | { ok: true, data: SolicitudChat }
 *   | { ok: false, error: { kind: 'validacion', mensaje: string } }
 *   | { ok: false, error: { kind: 'no-autenticado' | 'prohibido' | 'no-encontrado' | 'servidor' | 'red' } }
 * )} ResultadoActualizarSolicitud
 */

/**
 * Llama a `PATCH /api/v1/conversaciones/solicitudes` de chat-gateway: acepta
 * (`aceptada: true`) o rechaza (`aceptada: false`) una solicitud de chat
 * pendiente — no hay un endpoint separado por acción, el mismo booleano
 * decide las dos.
 *
 * **Ojo con quién debe ser `idToken`: al revés que `crearSolicitud`.** Aquí
 * el gateway compara la identidad contra **`solicitado`** (quien recibe la
 * solicitud), no contra `solicitante` — solo el receptor puede resolverla.
 * Mandar los usernames al revés (o con el idToken de quien no es el
 * receptor) responde `prohibido` aunque ambos usernames existan.
 *
 * `no-encontrado` (404) cubre tanto "nunca existió una solicitud entre
 * ambos" como "ya se resolvió antes" — el backend no distingue los dos
 * casos. Nunca lanza: resultado tipado, igual que el resto de `src/api/` y
 * `src/conversacion/`.
 *
 * @param {string} solicitante  username de quien envió la solicitud originalmente.
 * @param {string} solicitado   username de quien la recibió — debe ser el dueño de `idToken`.
 * @param {boolean} aceptada    `true` para aceptarla, `false` para rechazarla.
 * @param {string} idToken      idToken de Firebase de la sesión activa — debe ser el dueño de `solicitado`.
 * @returns {Promise<ResultadoActualizarSolicitud>}
 */
export const actualizarSolicitud = async (solicitante, solicitado, aceptada, idToken) => {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/v1/conversaciones/solicitudes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ solicitante, solicitado, aceptada }),
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
      return { ok: false, error: { kind: 'validacion', mensaje: problema.detail ?? '' } };
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
