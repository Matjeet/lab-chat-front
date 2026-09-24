import { API_BASE_URL } from '../api/config';

/**
 * URL del WebSocket de conexión (`GET /ws/chat/{usuario}`) — expuesto por
 * **chat-gateway**, no directo por chat-conversacion (ver
 * `chat-gateway/docs/contratos-api.md` §4.3: el gateway abre
 * por debajo un stream gRPC hacia chat-conversacion y traduce cada frame).
 * Comparte origen con el resto de la API (`API_BASE_URL`) — el gateway es el
 * único punto de entrada del sistema, un solo origen configurado. Deriva el
 * esquema `ws`/`wss` del de `API_BASE_URL` (`http`→`ws`, `https`→`wss`).
 *
 * @param {string} usuario
 * @returns {string}
 */
export const urlSocketConversacion = (usuario) =>
  `${API_BASE_URL.replace(/^http/, 'ws')}/ws/chat/${encodeURIComponent(usuario)}`;
