import { API_BASE_URL } from './config';
import { borrarUsuarioFirebase, crearUsuarioFirebase } from '../firebase/auth';

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

/** Traduce un error de Firebase Auth al mismo vocabulario que el del backend. */
const mapearErrorFirebase = (error) => {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      // Mismo mensaje genérico que el 409 del backend: no confirmar en la UI
      // que el email ya existe (anti-enumeración). La propia red de Firebase
      // igual responde distinto a quien inspeccione el tráfico; esto solo
      // evita que la UI lo delate.
      return { kind: 'duplicado' };
    case 'auth/invalid-email':
      return { kind: 'validacion', campos: { email: 'formato' } };
    case 'auth/weak-password':
    case 'auth/missing-password':
      return { kind: 'validacion', campos: { password: 'formato' } };
    case 'auth/network-request-failed':
      return { kind: 'red' };
    default:
      return { kind: 'servidor' };
  }
};

/** Traduce un Problem Details (RFC 9457) del backend — ver contrato §4. */
const mapearErrorBackend = (problema) => {
  switch (problema?.type) {
    case 'urn:problem-type:validation-error': {
      const campos = {};
      for (const err of problema.errors ?? []) {
        if (err?.field && !(err.field in campos)) {
          campos[err.field] = err.message ?? '';
        }
      }
      return { kind: 'validacion', campos };
    }
    case 'urn:problem-type:duplicate-resource':
    case 'urn:problem-type:data-integrity':
      return { kind: 'duplicado' };
    default:
      return { kind: 'servidor' };
  }
};

/** Revierte el alta en Firebase; si tampoco se puede borrar, no hay más que hacer. */
const revertirAltaFirebase = async (usuarioFirebase) => {
  try {
    await borrarUsuarioFirebase(usuarioFirebase);
  } catch {
    /* queda una cuenta de Firebase sin fila en la base de datos (caso raro) */
  }
};

/**
 * Alta de usuario: crea la identidad en **Firebase Auth** (email + password)
 * y guarda `username`/`email` en chat-registro, enlazados por el `uid` que
 * devuelve Firebase. La contraseña nunca se envía al backend — vive solo en
 * Firebase.
 *
 * Si Firebase crea el usuario pero el backend lo rechaza (cualquier motivo),
 * se revierte el alta en Firebase para no dejar una cuenta huérfana sin fila
 * correspondiente en la base de datos.
 *
 * ⚠️ **El endpoint de chat-registro todavía no acepta este contrato.** Hoy
 * exige `password` en el cuerpo (ver `chat-registro/docs/contratos-api.md`
 * §3.1) y no conoce `uid`; con el backend actual, todo registro llega hasta
 * aquí, crea el usuario en Firebase y luego el backend lo rechaza con 400 —
 * revirtiendo el alta de Firebase automáticamente. Hace falta actualizar el
 * backend para que el flujo funcione de punta a punta. Ver
 * `docs/integracion-api.md`.
 *
 * @param {{username: string, email: string, password: string}} datos
 * @returns {Promise<ResultadoRegistro>}
 */
export const registrarUsuario = async ({ username, email, password }) => {
  let usuarioFirebase;
  try {
    usuarioFirebase = await crearUsuarioFirebase({ email, password, username });
  } catch (error) {
    return { ok: false, error: mapearErrorFirebase(error) };
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/v1/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, uid: usuarioFirebase.uid }),
    });
  } catch {
    // Sin red, DNS, CORS, servicio caído...
    await revertirAltaFirebase(usuarioFirebase);
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

  await revertirAltaFirebase(usuarioFirebase);
  return { ok: false, error: mapearErrorBackend(problema) };
};
