/**
 * Configuración de acceso a `chat-conversacion` (WebSocket + REST, mismo
 * host/puerto — ver `chat-conversacion/docs/contratos-api.md` §1).
 *
 * En export estático, `NEXT_PUBLIC_CONVERSACION_BASE_URL` se inyecta en
 * tiempo de build. Define su valor en `.env.local` (desarrollo) o en el
 * entorno de CI/deploy. Por defecto apunta al chat-conversacion local.
 */
export const CONVERSACION_BASE_URL = (
  process.env.NEXT_PUBLIC_CONVERSACION_BASE_URL || 'http://localhost:8082'
).replace(/\/+$/, '');

/**
 * URL del WebSocket de conexión (`GET /ws/chat/{usuario}`, contrato §2.1).
 * Deriva el esquema `ws`/`wss` del de `CONVERSACION_BASE_URL` (`http`→`ws`,
 * `https`→`wss`) — un solo origen configurado, no dos variables a mantener
 * sincronizadas.
 *
 * @param {string} usuario
 * @returns {string}
 */
export const urlSocketConversacion = (usuario) =>
  `${CONVERSACION_BASE_URL.replace(/^http/, 'ws')}/ws/chat/${encodeURIComponent(usuario)}`;
