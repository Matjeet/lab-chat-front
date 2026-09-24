/**
 * Configuración de acceso al backend — chat-gateway, el único punto de
 * entrada REST/WebSocket del sistema (registro, chat en tiempo real y
 * consulta de usuario comparten este mismo origen).
 *
 * En export estático, `NEXT_PUBLIC_API_BASE_URL` se inyecta en tiempo de build.
 * Define su valor en `.env.local` (desarrollo) o en el entorno de CI/deploy.
 * Por defecto apunta al chat-gateway local.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '');
