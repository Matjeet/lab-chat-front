'use client';

import { useCallback, useEffect, useState } from 'react';

import { obtenerHistorial } from '../conversacion/historial';

/**
 * Conecta una conversación 1 a 1 con chat-conversacion: carga el historial
 * por REST y observa el canal de mensajes en tiempo real compartido por
 * toda la app (`canal`, de `useCanalMensajes` — un único socket para
 * `{yo}`, abierto una sola vez en `HomePage`) — dos canales independientes,
 * ninguno sustituye al otro (contrato §5.5). Este hook ya no abre su propio
 * WebSocket: solo decide, de cada mensaje que llega por `canal`, cuáles son
 * de esta conversación (`con`) y los añade a `mensajes`.
 *
 * El mensaje que llega por el socket es la única confirmación de envío
 * (contrato §5.3): `enviarMensaje` no añade nada a `mensajes` de forma
 * optimista, solo manda el frame; el propio remitente lo recibe de vuelta
 * por el socket igual que el destinatario, y ahí se pinta.
 *
 * @param {{yo: string, con: string, canal: {conectado: boolean, ultimoMensaje: import('../conversacion/historial').Mensaje|null, enviarMensaje: (destinatario: string, contenido: string) => {ok: boolean, error?: {kind: string, mensaje?: string}}}}} params
 *   `canal` es lo que devuelve `useCanalMensajes` — un único socket
 *   compartido por toda la app, no uno por conversación.
 * @returns {{
 *   mensajes: import('../conversacion/historial').Mensaje[],
 *   cargandoHistorial: boolean,
 *   errorHistorial: {kind: 'servidor'|'red'}|null,
 *   reintentarHistorial: () => void,
 *   conectado: boolean,
 *   enviarMensaje: (contenido: string) => {ok: true} | {ok: false, error: {kind: 'validacion', mensaje: string}}
 * }}
 */
const useConversacion = ({ yo, con, canal }) => {
  const [mensajes, setMensajes] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [intentoHistorial, setIntentoHistorial] = useState(0);

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
    // `intentoHistorial` no se lee dentro del efecto — solo está en las
    // dependencias para poder repetirlo a voluntad (ver `reintentarHistorial`),
    // igual que cambiar `yo`/`con` ya lo repite.
  }, [yo, con, intentoHistorial]);

  const reintentarHistorial = useCallback(() => setIntentoHistorial((n) => n + 1), []);

  useEffect(() => {
    const mensaje = canal.ultimoMensaje;
    if (!mensaje) return;

    // El socket de {yo} recibe TODO lo dirigido a {yo} (contrato §2.1), no
    // solo lo de esta conversación — `canal` ya no filtra nada (ver
    // useCanalMensajes.js), así que hace falta comprobarlo aquí antes de
    // añadirlo, o un mensaje de un tercero aparecería mezclado.
    //
    // Solo `canal.ultimoMensaje` en las dependencias, a propósito: `yo`/`con`
    // se leen igual, pero no hace falta que también disparen este efecto —
    // cambiar de interlocutor no debe reprocesar el último mensaje que ya se
    // procesó, solo el siguiente que llegue lo hará con el `con` vigente en
    // ese momento (el render en que `canal.ultimoMensaje` cambia de verdad ya
    // refleja el `con` actual).
    const esDeEstaConversacion =
      (mensaje.remitente === con && mensaje.destinatario === yo) ||
      (mensaje.remitente === yo && mensaje.destinatario === con);
    if (!esDeEstaConversacion) return;

    setMensajes((prev) =>
      prev.some((existente) => existente.id === mensaje.id) ? prev : [...prev, mensaje],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver comentario arriba
  }, [canal.ultimoMensaje]);

  const enviarMensaje = useCallback(
    (contenido) => canal.enviarMensaje(con, contenido),
    [canal, con],
  );

  return {
    mensajes,
    cargandoHistorial,
    errorHistorial,
    reintentarHistorial,
    conectado: canal.conectado,
    enviarMensaje,
  };
};

export default useConversacion;
