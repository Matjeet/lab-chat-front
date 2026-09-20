'use client';

import { useCallback, useEffect, useState } from 'react';

import { observarSesion } from '../firebase/auth';
import { obtenerUsuario } from '../api/usuario';
import { guardarMiUsuario, leerMiUsuario } from '../utils/miUsuario';

/**
 * "Tu usuario" (username de chat-registro) para pantallas que ya exigen
 * sesión — usar junto a `useRequiereSesion`, no en su lugar. Dos fuentes,
 * en orden:
 *
 * 1. `localStorage` (`src/utils/miUsuario.js`), leído de inmediato al
 *    montarse — lo que ya se supiera de una vez anterior (un alta en este
 *    navegador, o una sincronización previa de este mismo hook).
 * 2. `GET /api/v1/usuarios/{uid}` (chat-gateway, contrato §4.2, el único
 *    endpoint autenticado del sistema), en cuanto `observarSesion` entrega
 *    una sesión — tanto justo tras iniciar sesión como al abrir la pantalla
 *    ya con sesión activa (otra pestaña, otro navegador): es el mismo
 *    evento en ambos casos para el SDK de Firebase, no hace falta
 *    distinguirlos. **Nunca se llama sin sesión** (el callback de
 *    `observarSesion` no hace nada si `usuario` es `null`). Si resuelve,
 *    sustituye lo que hubiera y lo guarda en `localStorage` para la
 *    próxima vez.
 *
 * Si el backend falla (servicio caído, cuenta sin perfil en chat-registro
 * todavía...) no pasa nada más: lo de `localStorage` sigue disponible, y
 * `establecerYo` deja confirmarlo a mano como respaldo — ver `HomePage`.
 *
 * @returns {{ yo: string, establecerYo: (usuario: string) => void }}
 */
const useMiUsuario = () => {
  const [yo, setYo] = useState('');

  useEffect(() => {
    setYo(leerMiUsuario());
  }, []);

  useEffect(() => {
    const cancelar = observarSesion((usuario) => {
      if (!usuario) return;
      usuario
        .getIdToken()
        .then((idToken) => obtenerUsuario(usuario.uid, idToken))
        .then((resultado) => {
          if (resultado.ok) {
            guardarMiUsuario(resultado.data.username);
            setYo(resultado.data.username);
          }
        });
    });
    return cancelar;
  }, []);

  const establecerYo = useCallback((usuario) => {
    guardarMiUsuario(usuario);
    setYo(usuario);
  }, []);

  return { yo, establecerYo };
};

export default useMiUsuario;
