import { API_BASE_URL } from './config';

/**
 * @typedef {Object} RegistroResponse
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {boolean} activo
 * @property {string} createdAt  ISO-8601 UTC
 */

/**
 * @typedef {(
 *   | { ok: true, data: RegistroResponse }
 *   | { ok: false, error: { kind: 'validacion', campos: Record<string, string> } }
 *   | { ok: false, error: { kind: 'duplicado' | 'servidor' | 'red' } }
 * )} ResultadoRegistro
 */

/**
 * Llama a `POST /api/v1/registro` de chat-registro.
 *
 * Ramifica por el `type` del Problem Details (RFC 9457), nunca por `status` ni
 * por textos — ver chat-registro/docs/contratos-api.md §4.
 *
 * @param {{username: string, email: string, password: string}} datos
 * @returns {Promise<ResultadoRegistro>}
 */
export const registrarUsuario = async (datos) => {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/v1/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
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
    case 'urn:problem-type:validation-error': {
      const campos = {};
      for (const err of problema.errors ?? []) {
        if (err?.field && !(err.field in campos)) {
          campos[err.field] = err.message ?? '';
        }
      }
      return { ok: false, error: { kind: 'validacion', campos } };
    }
    case 'urn:problem-type:duplicate-resource':
    case 'urn:problem-type:data-integrity':
      return { ok: false, error: { kind: 'duplicado' } };
    default:
      return { ok: false, error: { kind: 'servidor' } };
  }
};
