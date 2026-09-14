'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { observarSesion } from '../firebase/auth';

/**
 * Para pantallas públicas donde no tiene sentido seguir si ya hay sesión
 * (`LoginPage`, `RegistroPage`): comprueba si hay una sesión de Firebase
 * activa y, si la hay, navega a `/home` (`router.replace` — no deja la
 * pantalla pública en el historial). Mismo mecanismo que `useRequiereSesion`,
 * en sentido contrario.
 *
 * A propósito, este hook **no bloquea el render**: quien lo usa pinta su
 * contenido real de inmediato (nada en export estático necesita esperar un
 * fetch) y la redirección, si hace falta, ocurre en segundo plano — la
 * mayoría de las veces no hay sesión, así que demorar la carga para
 * cubrir el caso contrario no compensa. Devuelve `{ comprobando }` solo
 * por si alguna pantalla concreta sí necesitara reaccionar a ese estado
 * (hoy ninguna lo consume).
 *
 * @returns {{ comprobando: boolean }}
 */
const useRedirigirSiHaySesion = () => {
  const router = useRouter();
  const [comprobando, setComprobando] = useState(true);

  useEffect(() => {
    const cancelar = observarSesion((usuario) => {
      if (usuario) {
        router.replace('/home');
      } else {
        setComprobando(false);
      }
    });
    return cancelar;
  }, [router]);

  return { comprobando };
};

export default useRedirigirSiHaySesion;
