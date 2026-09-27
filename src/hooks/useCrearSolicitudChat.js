'use client';

import { useCallback, useEffect, useState } from 'react';

import { observarSesion } from '../firebase/auth';
import { crearSolicitud } from '../conversacion/solicitudes';

/**
 * Crea una solicitud de chat — `POST /api/v1/conversaciones/solicitudes` de
 * chat-gateway, paso previo obligatorio para poder chatear con alguien (ver
 * `docs/integracion-conversacion.md`). Mismo patrón que `useExisteUsuario`:
 * solo resuelve el `idToken` de la sesión activa; sin sesión, resuelve
 * directamente con `{ ok: false, error: { kind: 'no-autenticado' } }` sin
 * llegar a llamar al backend.
 *
 * @returns {(solicitante: string, solicitado: string) => Promise<import('../conversacion/solicitudes').ResultadoCrearSolicitud>}
 */
const useCrearSolicitudChat = () => {
  const [idToken, setIdToken] = useState(null);

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

  return useCallback(
    (solicitante, solicitado) => {
      if (!idToken) {
        return Promise.resolve({ ok: false, error: { kind: 'no-autenticado' } });
      }
      return crearSolicitud(solicitante, solicitado, idToken);
    },
    [idToken],
  );
};

export default useCrearSolicitudChat;
