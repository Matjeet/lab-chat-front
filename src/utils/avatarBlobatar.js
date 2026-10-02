import {
  idle,
  happy,
  sad,
  mad,
  surprised,
  wink,
  sleepy,
  smug,
  unsure,
  scared,
  love,
  shy,
  sick,
  thinking,
} from 'blobatar/expression';

/**
 * Personalización del avatar de registro (`AvatarPersonalizable`) — puente
 * entre los controles simples que ve quien se registra (una forma con
 * nombre, un tono de color, una emoción) y las opciones reales que espera
 * `blobatar`/`@blobatar/react` (`traits.shape` como posición 0–1, `hue` en
 * grados, `expression` como el objeto importado, no un string).
 *
 * @typedef {Object} PersonalizacionAvatar
 * @property {string} [shape]        Id de {@link FORMAS}.
 * @property {number} [hue]          Grados, 0–359.
 * @property {number} [tone]         0–1 (pálido a tinta).
 * @property {string} [expression]   Id de {@link EMOCIONES}.
 */

/**
 * Las diez siluetas de Blobatar 2, con una posición representativa de cada
 * una dentro de su banda. `blobatar` no expone un nombre de forma como
 * opción directa — solo `traits.shape` como una posición 0–1 que un tabla
 * interna de umbrales traduce a una silueta (ver `blobatar/src/styles/blob.ts`
 * en el paquete instalado, `BANDS`) — así que aquí se fija, para cada forma,
 * el punto medio de su banda en la generación 2 (congelada mientras
 * `blobatar` seguía en `major` 2; una `major` nueva podría desplazar estos
 * números, ver el propio changelog de `blobatar` antes de subir de major).
 */
export const FORMAS = [
  { id: 'round', etiqueta: 'Redonda', posicion: 0.11 },
  { id: 'organic', etiqueta: 'Orgánica', posicion: 0.35 },
  { id: 'boxy', etiqueta: 'Cuadrada', posicion: 0.54 },
  { id: 'capsule', etiqueta: 'Cápsula', posicion: 0.65 },
  { id: 'nub', etiqueta: 'Redondeada', posicion: 0.745 },
  { id: 'cloud', etiqueta: 'Nube', posicion: 0.825 },
  { id: 'droplet', etiqueta: 'Gota', posicion: 0.8875 },
  { id: 'hexagon', etiqueta: 'Hexágono', posicion: 0.9325 },
  { id: 'sun', etiqueta: 'Sol', posicion: 0.965 },
  { id: 'triangle', etiqueta: 'Triángulo', posicion: 0.99 },
];

/** Las catorce poses de `blobatar/expression`, con etiqueta en español. */
export const EMOCIONES = [
  { id: 'idle', etiqueta: 'Neutral', valor: idle },
  { id: 'happy', etiqueta: 'Feliz', valor: happy },
  { id: 'sad', etiqueta: 'Triste', valor: sad },
  { id: 'mad', etiqueta: 'Enfadada', valor: mad },
  { id: 'surprised', etiqueta: 'Sorprendida', valor: surprised },
  { id: 'wink', etiqueta: 'Guiño', valor: wink },
  { id: 'sleepy', etiqueta: 'Con sueño', valor: sleepy },
  { id: 'smug', etiqueta: 'Presumida', valor: smug },
  { id: 'unsure', etiqueta: 'Insegura', valor: unsure },
  { id: 'scared', etiqueta: 'Asustada', valor: scared },
  { id: 'love', etiqueta: 'Enamorada', valor: love },
  { id: 'shy', etiqueta: 'Tímida', valor: shy },
  { id: 'sick', etiqueta: 'Mareada', valor: sick },
  { id: 'thinking', etiqueta: 'Pensando', valor: thinking },
];

export const HUE_MIN = 0;
export const HUE_MAX = 359;
export const TONE_MIN = 0;
export const TONE_MAX = 0.99; // 1 renderiza igual que 0 (ver Options de blobatar) — se evita ese salto.
export const TONE_STEP = 0.01;

/** Personalización con la que arranca el panel al abrirse por primera vez. */
export const PERSONALIZACION_INICIAL = { shape: 'round', hue: 200, tone: 0.5, expression: 'idle' };

/**
 * @param {PersonalizacionAvatar} personalizacion
 * @returns {import('blobatar').BlobatarOptions} listas para `<Blobatar {...opciones} />` (sin `name`).
 */
export const opcionesBlobatar = (personalizacion = {}) => {
  const opciones = {};
  const forma = FORMAS.find((f) => f.id === personalizacion.shape);
  if (forma) opciones.traits = { shape: forma.posicion };
  if (typeof personalizacion.hue === 'number') opciones.hue = personalizacion.hue;
  if (typeof personalizacion.tone === 'number') opciones.tone = personalizacion.tone;
  const emocion = EMOCIONES.find((e) => e.id === personalizacion.expression);
  if (emocion) opciones.expression = emocion.valor;
  return opciones;
};

/**
 * Serializa la personalización actual como el fragmento `<Blobatar .../>`
 * que `chat-gateway` persiste tal cual (`POST /api/v1/registro`, campo
 * `avatar` — ver `chat-gateway/docs/contratos-api.md` §4.1): el backend
 * exige una sola línea, sin `<`/`>` salvo los de apertura/cierre, terminada
 * en `/>`. Se construye a mano (nada de un serializador XML/JSX) porque el
 * formato es lo bastante acotado para no necesitar uno, y porque así se
 * controla exactamente qué sale, sin depender de cómo un serializador
 * genérico escaparía atributos.
 *
 * `username` no se escapa: el contrato de chat-registro ya limita ese campo
 * a `[A-Za-z0-9._-]`, así que nunca puede traer `"` ni romper el atributo.
 *
 * @param {string} username
 * @param {PersonalizacionAvatar} personalizacion
 * @returns {string}
 */
export const etiquetaBlobatar = (username, personalizacion = {}) => {
  const atributos = [`name="${username}"`];
  if (personalizacion.shape) atributos.push(`shape="${personalizacion.shape}"`);
  if (typeof personalizacion.hue === 'number') atributos.push(`hue="${personalizacion.hue}"`);
  if (typeof personalizacion.tone === 'number') atributos.push(`tone="${personalizacion.tone}"`);
  if (personalizacion.expression) atributos.push(`expression="${personalizacion.expression}"`);
  return `<Blobatar ${atributos.join(' ')} />`;
};

/**
 * `true` si `avatar` es una etiqueta `<Blobatar .../>` generada por este
 * frontend, `false` si es el otro formato que admite el contrato (un enlace
 * `http(s)`) o si no hay avatar en absoluto. Ver `AvatarUsuario`, que
 * decide con esto cómo pintar lo que devuelve `GET /api/v1/usuarios/{uid}`.
 *
 * @param {string|null|undefined} avatar
 * @returns {boolean}
 */
export const esEtiquetaBlobatar = (avatar) => typeof avatar === 'string' && avatar.startsWith('<Blobatar');

/**
 * El inverso de {@link etiquetaBlobatar}: lee de vuelta un fragmento
 * `<Blobatar .../>` ya guardado a `{name, shape, hue, tone, expression}` —
 * el mismo vocabulario que entiende {@link opcionesBlobatar}. Atributos
 * `clave="valor"` extraídos con una expresión regular, en vez de un parser
 * XML/JSX genérico — mismo criterio que al serializar: el formato es lo
 * bastante acotado para no necesitar uno. Un atributo que no reconoce (por
 * si una versión futura de este mismo frontend, u otro cliente, añade uno
 * nuevo) se ignora sin lanzar.
 *
 * @param {string} etiqueta
 * @returns {{name: string, shape?: string, hue?: number, tone?: number, expression?: string}}
 */
export const parsearEtiquetaBlobatar = (etiqueta) => {
  const resultado = { name: '' };
  const ATRIBUTO_RE = /(\w+)="([^"]*)"/g;
  let coincidencia = ATRIBUTO_RE.exec(etiqueta);
  while (coincidencia !== null) {
    const [, clave, valor] = coincidencia;
    if (clave === 'name') resultado.name = valor;
    else if (clave === 'shape') resultado.shape = valor;
    else if (clave === 'expression') resultado.expression = valor;
    else if (clave === 'hue') resultado.hue = Number(valor);
    else if (clave === 'tone') resultado.tone = Number(valor);
    coincidencia = ATRIBUTO_RE.exec(etiqueta);
  }
  return resultado;
};
