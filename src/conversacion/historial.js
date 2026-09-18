import { CONVERSACION_BASE_URL } from './config';

/**
 * @typedef {Object} Mensaje
 * @property {string} id           ObjectId de MongoDB en texto.
 * @property {string} remitente
 * @property {string} destinatario
 * @property {string} contenido
 * @property {string} enviadoEn    ISO-8601 UTC.
 */

/**
 * @typedef {Object} PaginaMensajes
 * @property {Mensaje[]} content
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
 *   | { ok: true, data: PaginaMensajes }
 *   | { ok: false, error: { kind: 'servidor' | 'red' } }
 * )} ResultadoHistorial
 */

/**
 * Llama a `GET /api/v1/conversaciones/{usuarioA}/{usuarioB}` de
 * chat-conversacion — el orden de los usuarios en la URL no importa (busca
 * mensajes en ambos sentidos). Nunca lanza: devuelve un resultado tipado,
 * igual que `src/api/registro.js`.
 *
 * Sin `page`/`size`/`sort`, el servidor usa sus valores por defecto (página
 * 0, tamaño 20, `enviadoEn` ascendente — el más antiguo primero). El
 * contrato no valida el formato de los usuarios en este endpoint: uno que
 * no exista simplemente devuelve una página vacía, no un error.
 *
 * @param {string} usuarioA
 * @param {string} usuarioB
 * @param {{page?: number, size?: number, sort?: string}} [opciones]
 * @returns {Promise<ResultadoHistorial>}
 */
export const obtenerHistorial = async (usuarioA, usuarioB, opciones = {}) => {
  const params = new URLSearchParams();
  if (opciones.page != null) params.set('page', opciones.page);
  if (opciones.size != null) params.set('size', opciones.size);
  if (opciones.sort) params.set('sort', opciones.sort);
  const query = params.toString();

  let respuesta;
  try {
    respuesta = await fetch(
      `${CONVERSACION_BASE_URL}/api/v1/conversaciones/${encodeURIComponent(usuarioA)}/${encodeURIComponent(usuarioB)}${query ? `?${query}` : ''}`,
    );
  } catch {
    // Sin red, DNS, CORS, servicio caído...
    return { ok: false, error: { kind: 'red' } };
  }

  if (respuesta.ok) {
    return { ok: true, data: await respuesta.json() };
  }

  return { ok: false, error: { kind: 'servidor' } };
};
