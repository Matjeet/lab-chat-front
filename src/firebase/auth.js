import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from './config';

/**
 * @typedef {Object} SesionIniciada
 * @property {string} uid
 * @property {string} email
 * @property {string} idToken  JWT de Firebase — el manejo frente al backend
 *   (validarlo, canjearlo, cuándo refrescarlo) es un paso aparte, no vive aquí.
 */

/**
 * @typedef {(
 *   | { ok: true, data: SesionIniciada }
 *   | { ok: false, error: { kind: 'credenciales' | 'demasiados-intentos' | 'red' | 'desconocido' } }
 * )} ResultadoInicioSesion
 */

/**
 * Inicia sesión contra Firebase Authentication (Email/Password) con el SDK
 * de cliente. Es la única función de este módulo que habla con Firebase;
 * nunca lanza — devuelve un resultado tipado, igual que `src/api/registro.js`.
 *
 * Los códigos de error de Firebase se agrupan a propósito: desde hace
 * versiones recientes del SDK, un email o contraseña incorrectos devuelven
 * ambos `auth/invalid-credential` (ya no distingue cuál falló, para no
 * facilitar enumeración de cuentas) — el mismo criterio que ya sigue
 * `chat-registro` con su 409 genérico.
 *
 * @param {{email: string, password: string}} credenciales
 * @returns {Promise<ResultadoInicioSesion>}
 */
export const iniciarSesion = async ({ email, password }) => {
  try {
    const credencial = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credencial.user.getIdToken();
    return {
      ok: true,
      data: { uid: credencial.user.uid, email: credencial.user.email, idToken },
    };
  } catch (error) {
    switch (error?.code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return { ok: false, error: { kind: 'credenciales' } };
      case 'auth/too-many-requests':
        return { ok: false, error: { kind: 'demasiados-intentos' } };
      case 'auth/network-request-failed':
        return { ok: false, error: { kind: 'red' } };
      default:
        return { ok: false, error: { kind: 'desconocido' } };
    }
  }
};
