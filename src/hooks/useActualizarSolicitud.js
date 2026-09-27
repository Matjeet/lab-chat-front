'use client';

import { useCallback, useEffect, useState } from 'react';

import { observarSesion } from '../firebase/auth';
import { actualizarSolicitud } from '../conversacion/solicitudes';

/**
 * Acepta o rechaza una solicitud de chat — `PATCH
 * /api/v1/conversaciones/solicitudes` de chat-gateway. Mismo patrón que
 * `useCrearSolicitudChat`: solo resuelve el `idToken` de la sesión activa;
 * sin sesión, resuelve directamente con
 * `{ ok: false, error: { kind: 'no-autenticado' } }` sin llegar a llamar al
 * backend.
 *
 * @returns {(solicitante: string, solicitado: string, aceptada: boolean) => Promise<import('../conversacion/solicitudes').ResultadoActualizarSolicitud>}
 */
const useActualizarSolicitud = () => {
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
    (solicitante, solicitado, aceptada) => {
      if (!idToken) {
        return Promise.resolve({ ok: false, error: { kind: 'no-autenticado' } });
      }
      return actualizarSolicitud(solicitante, solicitado, aceptada, idToken);
    },
    [idToken],
  );
};

export default useActualizarSolicitud;
