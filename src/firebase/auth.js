import {
  createUserWithEmailAndPassword,
  deleteUser,
  updateProfile,
} from 'firebase/auth';

import { obtenerAuth } from './client';

/**
 * Crea la identidad en Firebase Auth (email + password) y le pone el
 * username como `displayName` (best-effort: si falla, no aborta el alta —
 * lo importante ya está hecho). `createUserWithEmailAndPassword` deja la
 * sesión iniciada; no la cerramos, es el comportamiento querido tras un
 * registro (todavía no hay pantalla de login separada).
 *
 * No captura errores: lanza (FirebaseError con `.code`) para que quien llama
 * decida cómo traducirlo a la UI.
 *
 * @param {{email: string, password: string, username: string}} datos
 * @returns {Promise<import('firebase/auth').User>}
 */
export const crearUsuarioFirebase = async ({ email, password, username }) => {
  const auth = obtenerAuth();
  const credencial = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await updateProfile(credencial.user, { displayName: username });
  } catch {
    /* no crítico: el alta ya existe en Firebase aunque no se fije el nombre */
  }

  return credencial.user;
};

/**
 * Revierte un alta de Firebase (se usa cuando el backend rechaza el
 * registro, para no dejar una cuenta de Firebase sin fila en la base de
 * datos). Solo funciona mientras ese usuario sigue siendo el activo — que es
 * el caso justo después de crearlo, el único en que se llama.
 *
 * @param {import('firebase/auth').User} usuarioFirebase
 */
export const borrarUsuarioFirebase = (usuarioFirebase) => deleteUser(usuarioFirebase);
