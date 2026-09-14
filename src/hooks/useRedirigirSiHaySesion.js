'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { observarSesion } from '../firebase/auth';

/**
 * Para pantallas públicas donde no tiene sentido seguir si ya hay sesión
 * (`LoginPage`): comprueba si hay una sesión de Firebase activa y, si la
 * hay, navega a `/home` (`router.replace` — no deja la pantalla pública en
 * el historial). Mismo mecanismo que `useRequiereSesion`, en sentido
 * contrario.
 *
 * Devuelve `{ comprobando }`: mientras es `true`, todavía no se sabe si hay
 * sesión (o ya se decidió que sí la hay y se está navegando fuera) — quien
 * use el hook debe mostrar `CargandoSesion`, **nunca su contenido real**.
 * Pasa a `false` únicamente cuando se confirma que NO hay sesión.
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
