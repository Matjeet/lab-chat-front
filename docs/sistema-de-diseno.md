# Sistema de diseño

Estándares visuales del frontend. La **fuente de verdad ejecutable** es
[`src/styles/tokens.css`](../src/styles/tokens.css); este documento la explica y
fija las reglas de uso.

## Principios

1. **Tokens, no literales.** Ningún `.module.css` escribe un color, un tamaño de
   fuente o un valor de espaciado a mano. Todo se referencia con `var(--token)`.
   El único archivo con valores literales es `tokens.css`.
2. **Componer, no duplicar.** El estilo vive en el componente más atómico
   posible. Un organismo no re-estiliza un botón: usa el átomo `Button`.
3. **Accesible por defecto.** Contraste AA, foco siempre visible, objetivos
   táctiles suficientes, respeto por `prefers-reduced-motion`.
4. **Dos temas, un set de componentes.** Claro y oscuro se resuelven solo
   cambiando tokens de color; los componentes no saben en qué tema están.

## Tokens

### Color

Los tokens de color son **roles**, no nombres de color (`--color-primary`, no
`--color-indigo`). Así el mismo componente sirve en claro y oscuro.

| Token | Uso |
|-------|-----|
| `--color-bg` | Fondo de la página. |
| `--color-surface` | Fondo de tarjetas, inputs, cabecera. |
| `--color-surface-muted` | Fondo de elementos deshabilitados o secundarios. |
| `--color-border` / `--color-border-strong` | Bordes sutiles / con más presencia (inputs). |
| `--color-text` | Texto principal. |
| `--color-text-muted` | Texto secundario (labels, pies). |
| `--color-text-subtle` | Texto terciario (placeholders, notas). |
| `--color-primary` | Acción principal. `-hover` / `-active` para estados. |
| `--color-primary-soft` / `--color-primary-soft-text` | Botón `secondary`, badges. |
| `--color-on-primary` | Texto/icono sobre `--color-primary`. |
| `--color-success` / `--color-warning` / `--color-danger` | Estados semánticos. |
| `--color-success-soft` / `--color-danger-soft` | Fondo de avisos (`Alert` de éxito / error). |
| `--color-on-danger` | Texto sobre `--color-danger`. |
| `--color-focus-ring` | Color del anillo de foco. |

Contraste objetivo: **AA** (≥ 4.5:1 texto normal, ≥ 3:1 texto grande y bordes de
componentes) en ambos temas. Al añadir o cambiar un color, verificarlo.

### Tipografía

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-sans` | stack del sistema | Todo el texto. |
| `--font-mono` | stack mono del sistema | Código, tokens. |
| `--font-size-xs` … `--font-size-3xl` | 12 / 14 / 16 / 18 / 24 / 32 / 48 px | Escala tipográfica. `md` = base. `3xl` para números/splash grandes (p. ej. el "404"). |
| `--font-weight-regular` … `-bold` | 400 / 500 / 600 / 700 | Pesos. |
| `--line-height-tight` / `-base` | 1.25 / 1.5 | Titulares / cuerpo. |

### Espaciado

Escala de base **4px**. Usar solo estos valores para `margin`, `padding` y `gap`.

| Token | px | | Token | px |
|-------|----|-|-------|----|
| `--space-1` | 4 | | `--space-5` | 24 |
| `--space-2` | 8 | | `--space-6` | 32 |
| `--space-3` | 12 | | `--space-7` | 48 |
| `--space-4` | 16 | | `--space-8` | 64 |

### Bordes, radios, sombras, movimiento

| Token | Valor |
|-------|-------|
| `--border-width` | 1px |
| `--radius-sm` / `-md` / `-lg` / `-full` | 4 / 8 / 16 / 999 px |
| `--shadow-sm` / `-md` | elevación baja / media |
| `--transition-fast` / `-base` | 150ms / 250ms ease (→ 0ms con `prefers-reduced-motion`) |
| `--focus-ring-width` / `-offset` | 2px / 2px |
| `--z-header` / `--z-overlay` / `--z-toast` | 100 / 1000 / 1100 |
| `--layout-max-width` | 640px (ancho de contenido en `DefaultLayout`) |
| `--layout-form-width` | 420px (ancho de la tarjeta en `DefaultLayout centered`) |

## Temas (claro / oscuro)

- **Por defecto:** tema claro (`:root`).
- **Automático:** si el SO pide oscuro y el usuario no ha forzado claro
  (`@media (prefers-color-scheme: dark)`).
- **Manual:** el componente `ThemeToggle` (molécula, siempre en la cabecera de
  `DefaultLayout`) cicla `sistema → claro → oscuro` y lo guarda en
  `localStorage['theme']`.
- **Anti-parpadeo:** un script en `app/layout.jsx` (`strategy="beforeInteractive"`)
  aplica el tema guardado a `<html data-theme>` antes del primer render.

Para añadir un tema nuevo bastaría con un bloque `:root[data-theme="..."]` en
`tokens.css` y una opción más en `ThemeToggle`.

## Responsive

Mobile-first. Breakpoints de referencia (en las media queries van literales, no
hay token porque CSS no permite `var()` en condiciones):

| Nombre | min-width |
|--------|-----------|
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

`DefaultLayout` centra el contenido a `--layout-max-width`; por encima de eso el
contenido no crece, solo el margen. Con la prop `centered` (pantallas de un
solo formulario, p. ej. registro/login), el contenido además se centra
**verticalmente** en el espacio entre cabecera y pie, en un contenedor de
`--layout-form-width`. Con `tarjeta` (ver siguiente sección), ese contenedor
se convierte en una tarjeta visual sobre un fondo animado.

## Tarjeta y fondo animado (pantallas de login/registro)

`DefaultLayout` con `centered` + `tarjeta` (ver "Variantes de `DefaultLayout`"
en `arquitectura.md`) pone el formulario dentro de una tarjeta sobre un fondo
de burbujas de chat en movimiento:

- **Tarjeta**: `--color-surface` de fondo, borde `--color-border`, esquinas
  `--radius-lg`, sombra `--shadow-md`, relleno `--space-6`. Los mismos tokens
  que ya usa cualquier superficie elevada — no es una paleta nueva.
- **Fondo**: `PatronBurbujas` (átomo, SVG en línea) — 4 iconos de burbuja
  distintos rellenos con `--color-border`, en un `<pattern>` que se repite y
  se anima con `transform` en bucle infinito (la ilustración se pinta más
  grande que su contenedor y se traslada exactamente un mosaico; al llegar al
  final queda pixel a pixel donde empezó). Como es SVG en línea (no una imagen
  de fondo por CSS), el color sigue el tema solo. Cubre **toda la pantalla**
  (vive en `.layout`, no en `.content`): se ve detrás de la cabecera, del
  contenido y del pie. La cabecera y el pie mantienen su propio fondo sólido
  (`--color-surface`) encima, como barras fijas; `z-index: -1` en el SVG
  asegura que quede detrás pese a ser el primer hijo en el DOM. El fondo
  sólido del pie no es solo estético: sin él, al pintarse por encima del SVG
  en el orden de apilamiento pero ser transparente, la animación se vería a
  través suyo igualmente — cualquier banda que se superponga al patrón
  necesita su propio `--color-surface`, no basta con estar "por encima".
- **La animación es un placeholder a propósito** ("de momento cualquiera, ya
  veremos cuál"): vive entera en `@keyframes deriva-burbujas` de
  `PatronBurbujas.module.css`. Cambiarla — velocidad, dirección, otro tipo de
  movimiento — no toca ni el SVG ni `DefaultLayout`.
- Se anula con `prefers-reduced-motion: reduce` (igual que `--transition-*`).
- **No** se usa en `NotFoundPage`: su ilustración ya está pensada para
  fundirse con el fondo de la página (ver más abajo), y superponerle esta
  tarjeta rompería ese efecto.

## Reglas por nivel de Atomic Design

| Nivel | Estilo |
|-------|--------|
| **atoms** | Definen su aspecto con tokens. Exponen `variant` para las variaciones previstas (p. ej. `Button`: `primary` / `secondary` / `ghost` / `danger`). |
| **molecules** | Solo layout entre sus átomos (`gap`, dirección). No re-pintan los átomos. |
| **organisms** | Layout de sección y espaciado. Color/tipografía siguen viniendo de tokens. |
| **templates** | Rejilla de la pantalla, anchos máximos, zonas. Sin color de marca. |
| **pages** | Sin CSS salvo composición puntual. Nada de estilos "de una vez". |

## Accesibilidad — checklist al crear un componente

- [ ] Contraste AA en claro **y** oscuro.
- [ ] Foco visible (lo da `global.css` con `:focus-visible`; no quitar `outline`
      sin reemplazo).
- [ ] Interacción por teclado equivalente a la del ratón.
- [ ] Área clicable ≥ 40×40px en controles táctiles.
- [ ] Texto alternativo / `aria-label` en controles sin texto visible.
- [ ] Nada depende solo del color (añadir icono/texto). Ej.: `RequisitosCampo`
      marca lo cumplido con `--color-success` **y** un `✓` **y** un texto
      `(cumplido)` para lectores de pantalla (clase global `.sr-only`).
- [ ] Animaciones vía `--transition-*` (transiciones) o `@keyframes` propio
      (animaciones más largas, p. ej. `PatronBurbujas`) — en los dos casos, se
      anulan con `@media (prefers-reduced-motion: reduce)`.

### Helpers globales (`global.css`)

| Clase | Uso |
|-------|-----|
| `.sr-only` | Contenido solo para lectores de pantalla; oculto visualmente. |

## Gobernanza — cambiar el sistema

1. **Añadir un token:** editar `tokens.css` (y su variante oscura si es color),
   documentarlo en la tabla correspondiente de este archivo, y añadirlo a la
   guía viva (`src/components/pages/StyleGuidePage`).
2. **Cambiar un valor:** cambiarlo solo en `tokens.css`. Revisar `/estilos` en
   ambos temas antes de dar por bueno.
3. **Nunca** introducir un color/tamaño literal en un `.module.css`: `npm run
   lint` (Stylelint, regla `color-no-hex`) lo rechaza.
4. **Ilustraciones que cambian de tema, con dos SVG en línea:** cuando el
   propio dibujo (no solo el color) está pensado distinto para cada tema —
   ver `Ilustracion404`, con un SVG completo por tema en lugar de uno
   recoloreado por tokens — se inlinean los dos y el CSS del componente
   decide cuál se ve, con el mismo criterio que `tokens.css`: claro por
   defecto, oscuro por `prefers-color-scheme` o por `[data-theme="dark"]`.
   Las dos variantes se montan siempre (nunca se desmonta la que no toca) para
   que el cambio de tema sea instantáneo. Sus colores quedan tal cual los
   entregaron — no son tokens, es la paleta propia de esa ilustración.

## Herramientas

| Recurso | Qué es |
|---------|--------|
| `src/styles/tokens.css` | Definición de todos los tokens. |
| `/estilos` (`StyleGuidePage`) | Guía viva: paleta, tipografía, espaciado y componentes en todas sus variantes. Con selector de tema. |
| `npm run lint` | Stylelint: prohíbe hex/colores con nombre fuera de `tokens.css`. |
| `npm run lint:fix` | Autocorrige lo que puede. |
