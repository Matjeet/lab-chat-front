/**
 * Validación de cliente del formulario de registro.
 * Es el ESPEJO de las reglas de `POST /api/v1/registro`
 * (chat-registro/docs/contratos-api.md §3.1); la validación autoritativa
 * la hace el servidor y devuelve 400 con `errors[]`.
 *
 * Cada `validar*` devuelve `null` si el valor es válido, o el texto del error.
 */

const USERNAME_RE = /^[A-Za-z0-9._-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Textos de ayuda / error por campo (los que se muestran en la UI). */
export const REGLAS = {
  username: 'Entre 3 y 50 caracteres. Solo letras, números y los signos . _ -',
  email: 'Introduce un correo electrónico válido (máx. 255 caracteres).',
  password: 'Entre 8 y 100 caracteres.',
};

export const validarUsername = (valor = '') => {
  const v = valor.trim();
  if (!v) return 'El nombre de usuario es obligatorio.';
  if (v.length < 3 || v.length > 50) return REGLAS.username;
  if (!USERNAME_RE.test(v)) return REGLAS.username;
  return null;
};

export const validarEmail = (valor = '') => {
  const v = valor.trim();
  if (!v) return 'El correo electrónico es obligatorio.';
  if (v.length > 255) return 'El correo no puede superar los 255 caracteres.';
  if (!EMAIL_RE.test(v)) return REGLAS.email;
  return null;
};

export const validarPassword = (valor = '') => {
  if (!valor) return 'La contraseña es obligatoria.';
  if (valor.length < 8 || valor.length > 100) return REGLAS.password;
  return null;
};

/**
 * Valida el formulario completo.
 * @param {{username: string, email: string, password: string}} valores
 * @returns {Record<string, string>} errores por campo; objeto vacío si todo es válido.
 */
export const validarFormularioRegistro = (valores) => {
  const errores = {};
  const username = validarUsername(valores.username);
  const email = validarEmail(valores.email);
  const password = validarPassword(valores.password);
  if (username) errores.username = username;
  if (email) errores.email = email;
  if (password) errores.password = password;
  return errores;
};
