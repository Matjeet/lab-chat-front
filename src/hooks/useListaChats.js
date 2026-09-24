'use client';

import { useCallback, useEffect, useState } from 'react';

import { observarSesion } from '../firebase/auth';
import { obtenerListaChats } from '../conversacion/listaChats';

const TAMANO_PAGINA = 20;

/**
 * Lista de chats del usuario autenticado — `GET
 * /api/v1/conversaciones/{usuario}/chats` (chat-gateway, contrato §4.5),
 * paginada por cursor (scroll infinito, ver `cargarMas`).
 *
 * **Nunca se llama sin sesión activa**: además de no tener sentido, el
 * backend la rechazaría con `401` (es uno de los dos únicos endpoints
 * autenticados del sistema). El hook espera a dos cosas antes de pedir
 * nada: que `observarSesion` entregue una sesión de Firebase (de ahí saca
 * el `idToken`) y que `yo` (el username ya resuelto, ver `useMiUsuario`)
 * no esté vacío — sin ambos no hay a quién pedirle los chats.
 *
 * @param {string} yo  username de chat-registro del usuario autenticado (vacío = todavía no listo).
 * @returns {{
 *   chats: import('../conversacion/listaChats').ChatResumen[],
 *   cargando: boolean,
 *   cargandoMas: boolean,
 *   error: {kind: string}|null,
 *   hasMore: boolean,
 *   cargarMas: () => void,
 *   registrarMensajeEnviado: (otroUsuario: string, mensaje: import('../conversacion/historial').Mensaje) => void,
 * }}
 */
const useListaChats = (yo) => {
  const [idToken, setIdToken] = useState(null);
  const [chats, setChats] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState('');
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const cancelar = observarSesion((usuario) => {
      if (!usuario) {
        setIdToken(null);
        return;
      }
      usuario.getIdToken().then(setIdToken);
    });
    return cancelar;
  }, []);

  useEffect(() => {
    if (!yo || !idToken) return undefined;
    let activo = true;
    setCargando(true);
    setError(null);
    obtenerListaChats(yo, idToken, { size: TAMANO_PAGINA }).then((resultado) => {
      if (!activo) return;
      if (resultado.ok) {
        setChats(resultado.data.content);
        setCursor(resultado.data.nextCursor);
        setHasMore(resultado.data.hasMore);
      } else {
        setError(resultado.error);
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [yo, idToken]);

  const cargarMas = useCallback(() => {
    if (!yo || !idToken || !hasMore || cargandoMas) return;
    setCargandoMas(true);
    obtenerListaChats(yo, idToken, { cursor, size: TAMANO_PAGINA }).then((resultado) => {
      if (resultado.ok) {
        setChats((prev) => [...prev, ...resultado.data.content]);
        setCursor(resultado.data.nextCursor);
        setHasMore(resultado.data.hasMore);
      }
      // Un fallo al cargar "más" no reemplaza la lista ya mostrada por un
      // error de pantalla completa — solo deja de intentarlo; el usuario
      // puede seguir usando lo que ya cargó.
      setCargandoMas(false);
    });
  }, [yo, idToken, cursor, hasMore, cargandoMas]);

  /**
   * Actualiza la lista en cuanto se manda (y confirma) un mensaje, sin
   * esperar a un refresco completo: mueve (o crea) el chat con
   * `otroUsuario` a la primera posición con `mensaje` como su último. Es lo
   * que hace que un chat nuevo aparezca en la lista la primera vez —
   * antes de mandar el primer mensaje, ese chat no existe para
   * chat-conversacion (agrupa por mensajes reales), así que tampoco debe
   * existir en esta lista.
   */
  const registrarMensajeEnviado = useCallback((otroUsuario, mensaje) => {
    setChats((prev) => [
      { otroUsuario, ultimoMensaje: mensaje },
      ...prev.filter((chat) => chat.otroUsuario !== otroUsuario),
    ]);
  }, []);

  return { chats, cargando, cargandoMas, error, hasMore, cargarMas, registrarMensajeEnviado };
};

export default useListaChats;
