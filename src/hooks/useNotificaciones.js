'use client';

import { useCallback, useEffect, useState } from 'react';

import { observarSesion } from '../firebase/auth';
import { obtenerNotificaciones, actualizarLeida } from '../notificaciones/notificaciones';

const TAMANO_PAGINA = 20;

/**
 * Notificaciones del usuario autenticado — `GET /api/v1/notificaciones/{receptor}`
 * (chat-gateway, contrato §4.8) — y la acción de marcarlas como leídas/no leídas
 * (`PATCH /api/v1/notificaciones/{id}`, contrato §4.9).
 *
 * **`noLeidas` es un conteo aproximado**, no exacto: como el backend no expone un
 * endpoint dedicado para "cuántas sin leer tienes en total", se calcula sobre la
 * única página cargada (`TAMANO_PAGINA` más recientes) — si hay notificaciones sin
 * leer más atrás de esa página, no se cuentan. Aceptable para una insignia de
 * campana, no para un contador que se use para decidir algo crítico.
 *
 * **Nunca se llama sin sesión activa** (mismo criterio que `useListaChats`): espera
 * a `observarSesion` (de ahí saca `idToken` **y** `uid` — este último lo necesita
 * `actualizarLeida`, que compara por uid directo, no por username) y a que
 * `receptor` no esté vacío.
 *
 * @param {string} receptor  username de chat-registro del usuario autenticado (vacío = todavía no listo).
 * @returns {{
 *   notificaciones: import('../notificaciones/notificaciones').Notificacion[],
 *   cargando: boolean,
 *   error: {kind: string}|null,
 *   noLeidas: number,
 *   recargar: () => void,
 *   marcarLeida: (id: number) => void,
 *   marcarNoLeida: (id: number) => void,
 * }}
 */
const useNotificaciones = (receptor) => {
  const [idToken, setIdToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const cancelar = observarSesion((usuario) => {
      if (!usuario) {
        setIdToken(null);
        setUid(null);
        return;
      }
      setUid(usuario.uid);
      usuario.getIdToken().then(setIdToken);
    });
    return cancelar;
  }, []);

  useEffect(() => {
    if (!receptor || !idToken) return undefined;
    let activo = true;
    setCargando(true);
    setError(null);
    obtenerNotificaciones(receptor, idToken, { size: TAMANO_PAGINA }).then((resultado) => {
      if (!activo) return;
      if (resultado.ok) {
        setNotificaciones(resultado.data.content);
      } else {
        setError(resultado.error);
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [receptor, idToken, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const cambiarLeida = useCallback(
    (id, leida) => {
      if (!uid || !idToken) return;
      // Optimista: refleja el cambio de inmediato (p. ej. al pasar el mouse por
      // encima) sin esperar la respuesta — el estado de "leída" es de bajo
      // riesgo, no necesita reconciliación fina si la llamada falla en segundo
      // plano.
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida } : n)));
      actualizarLeida(id, uid, leida, idToken);
    },
    [uid, idToken],
  );

  const marcarLeida = useCallback((id) => cambiarLeida(id, true), [cambiarLeida]);
  const marcarNoLeida = useCallback((id) => cambiarLeida(id, false), [cambiarLeida]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return { notificaciones, cargando, error, noLeidas, recargar, marcarLeida, marcarNoLeida };
};

export default useNotificaciones;
