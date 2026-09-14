'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { observarSesion } from '../firebase/auth';

/**
 * Exige una sesión de Firebase activa para la pantalla que lo use. Sin
 * sesión, navega a `/login` (`router.replace` — no deja la pantalla
 * protegida en el historial).
 *
 * A propósito, este hook **no bloquea el render**: quien lo usa pinta su
 * contenido real de inmediato (nada en export estático necesita esperar un
 * fetch) y la redirección, si hace falta, ocurre en segundo plano — quien
 * entra a una pantalla protegida normalmente ya tiene sesión (es el destino
 * tras iniciarla), así que demorar la carga para cubrir el caso contrario
 * no compensa. Es una guardia de UX, no un límite de seguridad — ver
 * `docs/integracion-api.md` § "Rutas que exigen sesión". Devuelve
 * `{ verificando }` solo por si alguna pantalla concreta sí necesitara
 * reaccionar a ese estado (hoy ninguna lo consume).
 *
 * Es el mismo mecanismo que `LoginPage`/`RegistroPage` ya usan en sentido
 * contrario (ver `src/firebase/auth.js#observarSesion`): allá redirigen si
 * SÍ hay sesión, aquí si NO la hay.
 *
 * @returns {{ verificando: boolean }}
 */
const useRequiereSesion = () => {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const cancelar = observarSesion((usuario) => {
      if (usuario) {
        setVerificando(false);
      } else {
        router.replace('/login');
      }
    });
    return cancelar;
  }, [router]);

  return { verificando };
};

export default useRequiereSesion;
