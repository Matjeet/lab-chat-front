/**
 * Configuración del proyecto de Firebase. Se copia de
 * Firebase Console → Configuración del proyecto → Tus apps → SDK config.
 *
 * Son claves **públicas** (van en el bundle del cliente, `NEXT_PUBLIC_*`,
 * inyectadas en build time igual que `NEXT_PUBLIC_API_BASE_URL`): la
 * seguridad real la dan las reglas de Firebase y las restricciones de la API
 * key en Google Cloud, no que este valor esté oculto.
 *
 * Define los valores reales en `.env.local` (ver `.env.example`).
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
