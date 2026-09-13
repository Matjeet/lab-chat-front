'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { observarSesion } from '../firebase/auth';

/**
 * Exige una sesión de Firebase activa para la pantalla que lo use. Sin
 * sesión, navega a `/login` (`router.replace` — no deja la pantalla
 * protegida en el historial) en vez de dejar ver nada.
 *
 * Devuelve `{ verificando }`: mientras es `true`, todavía no se sabe si hay
 * sesión (o ya se decidió que no la hay y se está navegando fuera) — quien
 * use el hook debe mostrar un estado de carga, **nunca su contenido real**,
 * o lo estaría revelando un instante a quien no tiene sesión. Pasa a
 * `false` únicamente cuando SÍ hay un usuario autenticado.
 *
 * Es el mismo mecanismo que `LoginPage` ya usa en sentido contrario (ver
 * `src/firebase/auth.js#observarSesion`): allá redirige si SÍ hay sesión,
 * aquí si NO la hay.
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
