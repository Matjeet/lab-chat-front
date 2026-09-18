'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { urlSocketConversacion } from '../conversacion/config';
import { obtenerHistorial } from '../conversacion/historial';
import { validarContenido } from '../utils/validacionConversacion';

/**
 * Conecta una conversación 1 a 1 con chat-conversacion: carga el historial
 * por REST y abre el WebSocket de `{yo}` para mensajes nuevos — dos canales
 * independientes, ninguno sustituye al otro (contrato §5.5).
 *
 * El mensaje que llega por el socket es la única confirmación de envío
 * (contrato §5.3): `enviarMensaje` no añade nada a `mensajes` de forma
 * optimista, solo manda el frame; el propio remitente lo recibe de vuelta
 * por el socket igual que el destinatario, y ahí se pinta.
 *
 * @param {{yo: string, con: string}} params
 * @returns {{
 *   mensajes: import('../conversacion/historial').Mensaje[],
 *   cargandoHistorial: boolean,
 *   errorHistorial: {kind: 'servidor'|'red'}|null,
 *   conectado: boolean,
 *   enviarMensaje: (contenido: string) => {ok: true} | {ok: false, error: {kind: 'validacion', mensaje: string}}
 * }}
 */
const useConversacion = ({ yo, con }) => {
  const [mensajes, setMensajes] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef(null);
  // El efecto que abre el socket depende solo de `yo` (ver más abajo); este
  // ref le deja leer el `con` vigente en cada mensaje sin recrear la
  // conexión cada vez que cambia con quién se está hablando.
  const conRef = useRef(con);

  useEffect(() => {
    conRef.current = con;
  }, [con]);

  useEffect(() => {
    let activo = true;
    setCargandoHistorial(true);
    setErrorHistorial(null);

    // Más recientes primero en la petición (contrato §5.7), invertido aquí
    // para pintar la conversación en orden cronológico.
    obtenerHistorial(yo, con, { size: 50, sort: 'enviadoEn,desc' }).then((resultado) => {
      if (!activo) return;
      if (resultado.ok) {
        setMensajes([...resultado.data.content].reverse());
      } else {
        setErrorHistorial(resultado.error);
      }
      setCargandoHistorial(false);
    });

    return () => {
      activo = false;
    };
  }, [yo, con]);

  useEffect(() => {
    const socket = new WebSocket(urlSocketConversacion(yo));
    socketRef.current = socket;

    socket.onopen = () => setConectado(true);
    socket.onclose = () => setConectado(false);
    socket.onerror = () => setConectado(false);
    socket.onmessage = (evento) => {
      let mensaje;
      try {
        mensaje = JSON.parse(evento.data);
      } catch {
        return; // frame que no es JSON: se ignora, no debería pasar según el contrato
      }

      // El socket de {yo} recibe TODO lo dirigido a {yo} (contrato §2.1),
      // no solo lo de esta conversación — filtrar por `con` (vía ref, ver
      // arriba) antes de añadirlo, o un mensaje de un tercero aparecería
      // aquí mezclado.
      const interlocutor = conRef.current;
      const esDeEstaConversacion =
        (mensaje.remitente === interlocutor && mensaje.destinatario === yo) ||
        (mensaje.remitente === yo && mensaje.destinatario === interlocutor);
      if (!esDeEstaConversacion) return;

      setMensajes((prev) =>
        prev.some((existente) => existente.id === mensaje.id) ? prev : [...prev, mensaje],
      );
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `con` se lee
    // dentro del handler sin recrear el socket: cambiar de interlocutor no
    // debe reabrir la conexión, solo cambia a qué mensajes hace caso.
  }, [yo]);

  const enviarMensaje = useCallback(
    (contenido) => {
      const error = validarContenido(contenido);
      if (error) {
        return { ok: false, error: { kind: 'validacion', mensaje: error } };
      }
      socketRef.current?.send(JSON.stringify({ destinatario: con, contenido: contenido.trim() }));
      return { ok: true };
    },
    [con],
  );

  return { mensajes, cargandoHistorial, errorHistorial, conectado, enviarMensaje };
};

export default useConversacion;
