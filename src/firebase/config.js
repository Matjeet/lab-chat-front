import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Configuración del proyecto Firebase para el SDK de **cliente** (por ahora
 * solo Authentication). Estos valores no son secretos — viajan en el bundle
 * de cualquier app Firebase; lo que protege el proyecto son las reglas de
 * seguridad y los dominios autorizados en la consola, no ocultar esta clave.
 * Aun así salen de variables de entorno (mismo patrón que
 * `NEXT_PUBLIC_API_BASE_URL` en `src/api/config.js`) para poder apuntar a
 * otro proyecto sin tocar código. Definirlas en `.env.local`.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evita volver a inicializar la app en Fast Refresh (dev) y en los tests,
// donde el módulo puede cargarse más de una vez.
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
