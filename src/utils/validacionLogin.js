import { validarEmail } from './validacionRegistro';

/**
 * Validación de cliente del formulario de login.
 *
 * A propósito **no** reutiliza la política de fortaleza de
 * `validacionRegistro.js`: en login no sabemos ni nos importa si la
 * contraseña de una cuenta ya existente cumple las reglas actuales — solo
 * que se haya escrito algo. La validación real (¿es correcta?) la hace el
 * servicio de autenticación, que todavía no está conectado.
 */

export const REGLAS_LOGIN = {
  password: 'Introduce tu contraseña.',
};

export const validarPasswordLogin = (valor = '') => {
  if (!valor) return 'La contraseña es obligatoria.';
  return null;
};

/**
 * @param {{email: string, password: string}} valores
 * @returns {Record<string, string>} errores por campo; objeto vacío si todo es válido.
 */
export const validarFormularioLogin = (valores) => {
  const errores = {};
  const email = validarEmail(valores.email);
  const password = validarPasswordLogin(valores.password);
  if (email) errores.email = email;
  if (password) errores.password = password;
  return errores;
};
