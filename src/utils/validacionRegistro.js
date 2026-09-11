/**
 * Validación de cliente del formulario de registro.
 *
 * `username` y `email` son el ESPEJO de las reglas de `POST /api/v1/registro`
 * (chat-registro/docs/contratos-api.md §3.1).
 *
 * `password` es más estricta que el contrato (que solo exige 8–100
 * caracteres): añade una política de fortaleza que hoy **solo se aplica en
 * este frontend** — el backend seguiría aceptando una contraseña de 8+
 * caracteres sin mayúscula/número/símbolo. Si se quiere reforzar también en
 * el servidor, es un cambio aparte en chat-registro.
 *
 * La validación autoritativa sigue siendo la del servidor (devuelve 400 con
 * `errors[]`); esto es solo para feedback inmediato.
 *
 * Cada `validar*` devuelve `null` si el valor es válido, o el texto del error.
 */

const USERNAME_RE = /^[A-Za-z0-9._-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MINUSCULA_RE = /[a-z]/;
const MAYUSCULA_RE = /[A-Z]/;
const NUMERO_RE = /[0-9]/;
// "Especial" = cualquier carácter que no sea letra, número o espacio.
const ESPECIAL_RE = /[^A-Za-z0-9\s]/;
// El mismo carácter 4 o más veces seguidas (p. ej. "aaaa", "1111").
const REPETICION_CONSECUTIVA_RE = /(.)\1{3,}/;

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;

/** Textos de ayuda / error por campo (los que se muestran en la UI). */
export const REGLAS = {
  username: 'Entre 3 y 50 caracteres. Solo letras, números y los signos . _ -',
  email: 'Introduce un correo electrónico válido (máx. 255 caracteres).',
  password:
    `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres, con mayúscula, ` +
    'minúscula, número y carácter especial; ningún carácter repetido 4 o ' +
    'más veces seguidas.',
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

/**
 * Requisitos de la contraseña, con su estado de cumplimiento en vivo.
 * Se muestran bajo el input mientras tiene el foco (ver `FormField`).
 * @returns {{id: string, texto: string, cumplido: boolean}[]}
 */
export const requisitosPassword = (valor = '') => [
  {
    id: 'longitud',
    texto: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`,
    cumplido: valor.length >= PASSWORD_MIN && valor.length <= PASSWORD_MAX,
  },
  {
    id: 'minuscula',
    texto: 'Al menos una letra minúscula',
    cumplido: MINUSCULA_RE.test(valor),
  },
  {
    id: 'mayuscula',
    texto: 'Al menos una letra mayúscula',
    cumplido: MAYUSCULA_RE.test(valor),
  },
  {
    id: 'numero',
    texto: 'Al menos un número',
    cumplido: NUMERO_RE.test(valor),
  },
  {
    id: 'especial',
    texto: 'Al menos un carácter especial',
    cumplido: ESPECIAL_RE.test(valor),
  },
  {
    id: 'repeticion',
    texto: 'Ningún carácter repetido 4 o más veces seguidas',
    cumplido: valor.length > 0 && !REPETICION_CONSECUTIVA_RE.test(valor),
  },
];

export const validarPassword = (valor = '') => {
  if (!valor) return 'La contraseña es obligatoria.';
  const cumpleTodo = requisitosPassword(valor).every((r) => r.cumplido);
  return cumpleTodo ? null : REGLAS.password;
};

/**
 * Requisitos del nombre de usuario, con su estado de cumplimiento en vivo.
 * @returns {{id: string, texto: string, cumplido: boolean}[]}
 */
export const requisitosUsername = (valor = '') => {
  const v = valor.trim();
  return [
    {
      id: 'longitud',
      texto: 'Entre 3 y 50 caracteres',
      cumplido: v.length >= 3 && v.length <= 50,
    },
    {
      id: 'formato',
      texto: 'Solo letras, números y los signos . _ -',
      cumplido: v.length > 0 && USERNAME_RE.test(v),
    },
  ];
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
