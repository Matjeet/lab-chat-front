'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { urlSocketConversacion } from '../conversacion/config';
import { validarContenido } from '../utils/validacionConversacion';

// Si la conexión se cae (o nunca llega a abrirse porque chat-gateway estaba
// caído), reintentar automáticamente en vez de dejar `conectado` en `false`
// para siempre — el contrato lo pide explícitamente: "el cliente debe tratar
// eso como una desconexión y reintentar" (chat-gateway/docs/contratos-api.md
// §4.3). Un retraso fijo es intencional aquí (nada de backoff exponencial):
// es una app de una sola conversación a la vez, no hace falta esa complejidad.
const RETRASO_REINTENTO_SOCKET_MS = 3000;

/**
 * Único punto del frontend que abre el WebSocket de `{yo}` a chat-gateway
 * (`GET /ws/chat/{usuario}`, contrato §4.3) — antes esa conexión vivía
 * dentro de `useConversacion`, que solo se monta con una conversación
 * abierta, así que un mensaje dirigido a `{yo}` de un chat sin abrir (o sin
 * ningún chat seleccionado) nunca llegaba a ningún sitio, ni siquiera para
 * actualizar `ListaChats`. Este hook se llama una sola vez, arriba en
 * `HomePage`, en cuanto se conoce `yo` — sin depender de con quién se esté
 * chateando ahora mismo.
 *
 * A diferencia de lo que hacía antes el `onmessage` dentro de
 * `useConversacion`, aquí **no se filtra por conversación**: cada mensaje
 * válido que llega se expone tal cual en `ultimoMensaje` (siempre un objeto
 * nuevo, nunca la misma referencia entre dos mensajes) — decidir qué hacer
 * con él es cosa de quien consuma el hook (`useConversacion` para pintarlo
 * si es de la conversación abierta, `HomePage` para actualizar `ListaChats`
 * sin importar cuál esté abierta).
 *
 * @param {string} yo  username ya resuelto (vacío = no conectar todavía).
 * @returns {{
 *   conectado: boolean,
 *   ultimoMensaje: import('../conversacion/historial').Mensaje | null,
 *   enviarMensaje: (destinatario: string, contenido: string) =>
 *     {ok: true} | {ok: false, error: {kind: 'validacion', mensaje: string}},
 * }}
 */
const useCanalMensajes = (yo) => {
  const [conectado, setConectado] = useState(false);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!yo) return undefined;

    let activo = true;
    let socket;
    let temporizadorReintento;

    const conectar = () => {
      socket = new WebSocket(urlSocketConversacion(yo));
      socketRef.current = socket;

      socket.onopen = () => setConectado(true);
      socket.onclose = () => {
        setConectado(false);
        // Un cierre por servidor caído (o que nunca llegó a abrir) no debe
        // dejar el canal muerto hasta recargar la página — reintentar sigue
        // siendo lo correcto tanto si chat-gateway está reiniciando como si
        // acaba de volver. `onerror` siempre dispara `onclose` después (así
        // lo define WebSocket), así que basta con programar el reintento
        // aquí.
        if (activo) {
          temporizadorReintento = setTimeout(conectar, RETRASO_REINTENTO_SOCKET_MS);
        }
      };
      socket.onerror = () => setConectado(false);
      socket.onmessage = (evento) => {
        let mensaje;
        try {
          mensaje = JSON.parse(evento.data);
        } catch {
          return; // frame que no es JSON: se ignora, no debería pasar según el contrato
        }
        setUltimoMensaje(mensaje);
      };
    };

    conectar();

    return () => {
      activo = false;
      clearTimeout(temporizadorReintento);
      socket.close();
      socketRef.current = null;
    };
  }, [yo]);

  const enviarMensaje = useCallback((destinatario, contenido) => {
    const error = validarContenido(contenido);
    if (error) {
      return { ok: false, error: { kind: 'validacion', mensaje: error } };
    }
    socketRef.current?.send(JSON.stringify({ destinatario, contenido: contenido.trim() }));
    return { ok: true };
  }, []);

  return { conectado, ultimoMensaje, enviarMensaje };
};

export default useCanalMensajes;
