import { API_BASE_URL } from './config';

/**
 * @typedef {Object} RegistroResponse
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string|null} avatar  `null` si no se envió ninguno. Enlace http(s) o etiqueta `<Blobatar .../>`.
 * @property {string} proveedor  Proveedor de identidad usado en el alta (hoy siempre "password").
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
 * Llama a `POST /api/v1/registro` de chat-gateway (§4.1 de su contrato), que
 * reenvía a `chat-registro`.
 *
 * El propio backend crea la cuenta en el proveedor de identidad (Firebase
 * Auth) antes de persistir el perfil — este frontend **no** habla con
 * Firebase por su cuenta: solo manda `username`, `email`, `password` y
 * `avatar` (ver chat-registro/docs/contratos-api.md §3.1 y §6).
 *
 * `avatar` es opcional: el fragmento `<Blobatar .../>` que arma
 * `src/utils/avatarBlobatar.js#etiquetaBlobatar` (ver `AvatarPersonalizable`,
 * en `RegistroForm`) — el gateway también acepta un enlace `http(s)`, pero
 * este frontend hoy solo genera el primero.
 *
 * Ramifica por el `type` del Problem Details (RFC 9457), nunca por `status` ni
 * por textos — ver contrato §4.
 *
 * @param {{username: string, email: string, password: string, avatar?: string}} datos
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
