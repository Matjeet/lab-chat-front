'use client';

import { useCallback, useEffect, useState } from 'react';

import { observarSesion } from '../firebase/auth';
import { existeUsuario } from '../api/usuario';

/**
 * Comprueba si un username ya existe en chat-registro — `GET
 * /api/v1/usuarios/existe` de chat-gateway (contrato §4.6), el tercer y
 * último endpoint autenticado del sistema. A diferencia de `useMiUsuario` o
 * `useListaChats`, este endpoint **no compara identidad**: basta con que
 * haya *alguna* sesión de Firebase activa, no hace falta que sea la del
 * `username` que se consulta — así que el hook solo necesita el `idToken`
 * de la sesión, no un `yo` como argumento.
 *
 * @returns {(username: string) => Promise<import('../api/usuario').ResultadoExisteUsuario>}
 *   Función para comprobar un username. Sin sesión todavía (o si se
 *   perdió), resuelve directamente con `{ ok: false, error: { kind: 'no-autenticado' } }`
 *   sin llegar a llamar al backend — igual resultado que si el backend lo
 *   rechazara, pero sin gastar la llamada.
 */
const useExisteUsuario = () => {
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
    (username) => {
      if (!idToken) {
        return Promise.resolve({ ok: false, error: { kind: 'no-autenticado' } });
      }
      return existeUsuario(username, idToken);
    },
    [idToken],
  );
};

export default useExisteUsuario;
