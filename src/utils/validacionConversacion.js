/**
 * Validación de cliente para la integración con chat-conversacion — espejo
 * de las reglas del contrato (`chat-conversacion/docs/contratos-api.md`
 * §2.2), la autoritativa sigue siendo el servidor. Importante aquí en
 * particular: el WebSocket **descarta en silencio** un mensaje que no
 * cumpla el formato (sin frame de error), así que validar antes de mandar
 * no es una mejora de UX opcional — es la única forma de enterarse.
 */

// Mismo formato que exige chat-registro para `username` (3–50, `A–Z a–z 0–9 . _ -`).
export const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/;

export const CONTENIDO_MAX = 2000;

export const REGLAS_CONVERSACION = {
  usuario: 'Entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo.',
  contenido: `No puede estar vacío ni superar los ${CONTENIDO_MAX} caracteres.`,
};

/**
 * @param {string} valor
 * @returns {string|null}
 */
export const validarUsername = (valor = '') => {
  const limpio = valor.trim();
  if (!limpio) return 'Este campo es obligatorio.';
  if (!USERNAME_REGEX.test(limpio)) return REGLAS_CONVERSACION.usuario;
  return null;
};

/**
 * @param {string} valor
 * @returns {string|null}
 */
export const validarContenido = (valor = '') => {
  const limpio = valor.trim();
  if (!limpio) return 'Escribe un mensaje.';
  if (limpio.length > CONTENIDO_MAX) return REGLAS_CONVERSACION.contenido;
  return null;
};
