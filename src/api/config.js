/**
 * Configuración de acceso a los servicios backend.
 *
 * En export estático, `NEXT_PUBLIC_API_BASE_URL` se inyecta en tiempo de build.
 * Define su valor en `.env.local` (desarrollo) o en el entorno de CI/deploy.
 * Por defecto apunta al chat-registro local.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '');
