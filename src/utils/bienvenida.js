/**
 * Aviso de bienvenida de una sola vez: `RegistroPage` lo marca justo antes de
 * iniciar sesión tras un alta correcta, y `HomePage` lo consume al montarse
 * para mostrar el mensaje — una vez consumido desaparece, así que ni una
 * recarga ni un inicio de sesión posterior lo vuelven a mostrar.
 *
 * `sessionStorage` (no `localStorage`): es un relevo entre dos pantallas de
 * la misma pestaña, no algo que deba sobrevivir a ella. Tolerante a fallos
 * (modo incógnito, almacenamiento deshabilitado...): si no se puede guardar,
 * simplemente no hay bienvenida.
 */
const CLAVE = 'chat:bienvenidaPendiente';

export const marcarBienvenidaPendiente = () => {
  try {
    sessionStorage.setItem(CLAVE, '1');
  } catch {
    /* almacenamiento no disponible: sin bienvenida */
  }
};

export const descartarBienvenidaPendiente = () => {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* almacenamiento no disponible: nada que descartar */
  }
};

/**
 * @returns {boolean} `true` si había una bienvenida pendiente — y la consume,
 *   así que la siguiente llamada devuelve `false`.
 */
export const consumirBienvenidaPendiente = () => {
  try {
    const pendiente = sessionStorage.getItem(CLAVE) === '1';
    if (pendiente) sessionStorage.removeItem(CLAVE);
    return pendiente;
  } catch {
    return false;
  }
};
