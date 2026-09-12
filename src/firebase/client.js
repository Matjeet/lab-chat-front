import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { FIREBASE_CONFIG } from './config';

let authInstance = null;

/**
 * Devuelve la instancia de Firebase Auth, inicializándola solo la primera
 * vez que hace falta de verdad (dentro de un manejador de evento, nunca en
 * el cuerpo del módulo).
 *
 * Con `output: 'export'`, Next hace un pase de prerender en Node para
 * generar el HTML estático de las páginas — ahí no existe `window`, e
 * inicializar Firebase Auth en ese momento rompería el build. Por eso esto
 * es un getter perezoso: `src/firebase/auth.js` solo lo llama dentro de las
 * funciones que se ejecutan al enviar el formulario, ya en el navegador.
 */
export const obtenerAuth = () => {
  if (typeof window === 'undefined') {
    throw new Error(
      'Firebase Auth solo está disponible en el navegador (no en build/SSR).',
    );
  }
  if (!authInstance) {
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    authInstance = getAuth(app);
  }
  return authInstance;
};
