import { API_BASE_URL } from '../api/config';

/**
 * @typedef {Object} SolicitudChat
 * @property {string} id
 * @property {string} solicitante
 * @property {string} solicitado
 * @property {boolean} aceptada
 * @property {string} creadaEn
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
 * comprueba él mismo y devuelve `prohibido` si no coincide. Nunca lanza:
 * resultado tipado, igual que el resto de `src/api/` y `src/conversacion/`.
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
