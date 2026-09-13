# Arquitectura del frontend

## Stack

- **Next.js 16** con **App Router**, en modo **export estático**
  (`output: 'export'` en `next.config.js`).
- **React 19**.
- **Jest + Testing Library** (a través de `next/jest`) para los tests unitarios.
- **CSS Modules** para estilos con ámbito local por componente.

No se usa TypeScript en esta cáscara; se puede añadir más adelante.

### Export estático

`next build` produce HTML/JS/CSS en `out/`. Ese directorio se sirve tal cual con
Nginx o una CDN, sin proceso Node en producción. Consecuencias:

- No hay SSR en runtime, ni API routes, ni middleware, ni Server Actions.
- Todo se prerenderiza en tiempo de build o se renderiza en el cliente.
- El optimizador de imágenes de Next se desactiva (`images.unoptimized`).
- `app/not-found.jsx` se exporta como `out/404.html`. Quien configure el
  servidor (Nginx, CDN...) debe apuntar su `error_page 404` / *custom error
  document* ahí para que se sirva en vez de un 404 genérico del servidor.

## App Router vs. componentes

`app/` **solo** contiene enrutado:

| Archivo | Rol |
|---------|-----|
| `app/layout.jsx` | Layout raíz: `<html>`, `<body>`, import del CSS global, metadata. |
| `app/page.jsx` | Ruta `/`. Solo hace `return <HomePage/>`. |

Toda la interfaz y su lógica viven en `src/components/` siguiendo Atomic Design.
Añadir una pantalla nueva = crear `app/ruta/page.jsx` que renderiza la `page`
correspondiente de Atomic Design.

### Client vs. Server Components

Los componentes del App Router son Server Components por defecto. Un componente
que use estado, efectos o handlers de eventos necesita `'use client'` en la
primera línea (p. ej. `HomePage`). Sus hijos heredan el modo cliente.

## Atomic Design

La interfaz se organiza en cinco niveles, de menor a mayor complejidad. Cada
nivel solo puede depender de niveles inferiores:

```
atoms  ->  molecules  ->  organisms  ->  templates  ->  pages
```

| Nivel | Qué es | Ejemplos en el repo |
|-------|--------|---------------------|
| **atoms** | Elementos indivisibles de UI. | `Button`, `Input` |
| **molecules** | Grupos pequeños de átomos con una función. | `FormField` |
| **organisms** | Secciones reconocibles de una pantalla. | `Header` |
| **templates** | Estructura/layout de una pantalla, sin datos. | `DefaultLayout` |
| **pages** | Plantilla + datos + lógica reales. | `HomePage` |

### Regla de dependencia

Un componente **nunca** importa de su mismo nivel ni de uno superior. Si dos
átomos necesitan compartir algo, ese algo probablemente es otro átomo o un
helper en `src/utils/`.

## Estructura de carpetas

```
chat-frontend/
├── docs/                      # Documentación (este directorio)
├── assets/                    # Fuentes de diseño a inlinear a mano (ver su README)
│   ├── 404-claro.svg
│   └── 404-oscuro.svg
├── app/                       # App Router (solo enrutado)
│   ├── layout.jsx             # html/body + tokens + global.css + tema inicial
│   ├── page.jsx               # "/"         -> <HomePage/>
│   ├── registro/page.jsx      # "/registro" -> <RegistroPage/>
│   ├── estilos/page.jsx       # "/estilos"  -> <StyleGuidePage/> (guía viva)
│   └── not-found.jsx          # 404 (ruta inexistente o notFound()) -> <NotFoundPage/>
├── src/
│   ├── setupTests.js          # Setup global de Jest (matchers de jest-dom)
│   ├── api/                   # Acceso a los servicios backend
│   │   ├── config.js          # API_BASE_URL (NEXT_PUBLIC_API_BASE_URL)
│   │   └── registro.js        # POST /api/v1/registro -> resultado tipado
│   ├── utils/                 # Helpers puros (sin React)
│   │   └── validacionRegistro.js
│   ├── styles/
│   │   ├── tokens.css         # Tokens de diseño (ver sistema-de-diseno.md)
│   │   └── global.css         # Reset y estilos base
│   └── components/
│       ├── atoms/             Button · Input · Alert · Ilustracion404
│       ├── molecules/         FormField · ThemeToggle · RequisitosCampo
│       ├── organisms/         Header · RegistroForm
│       ├── templates/         DefaultLayout
│       └── pages/             HomePage · RegistroPage · StyleGuidePage · NotFoundPage
│           └── Button/
│               ├── Button.jsx
│               ├── Button.module.css
│               ├── Button.test.jsx
│               └── index.js   # barrel: export { default } from './Button'
├── jsconfig.json              # alias "@/*" -> "src/*"
├── next.config.js
├── jest.config.js
├── .stylelintrc.json
└── package.json
```

## Assets estáticos: `public/` vs. SVG en línea

Tres formas de meter una imagen, según si debe adaptarse al tema:

- **No necesita re-tematizarse** (foto, ilustración con paleta fija, logo de
  marca): archivo en `public/`, referenciado como `/archivo.ext` (sin
  `public/` en la ruta) con un `<img>` normal — no hace falta `next/image`
  para algo estático en export mode.
- **Solo cambian algunos colores puntuales del mismo dibujo**: SVG **en
  línea**, como componente JSX. Un `<img src="...svg">` no puede leer
  `var(--token)` — el navegador no aplica el CSS de la página dentro del
  archivo; inlineado como JSX sí (`fill="#hex"` → `fill="var(--color-x)"`).
- **Hay un dibujo distinto por tema** (no solo un recolor): dos SVG en línea
  en el mismo componente, uno por tema, y el CSS decide cuál se ve — ver
  `Ilustracion404`. Ninguno usa tokens de color: cada archivo trae la paleta
  que le hicieron para su tema, tal cual.

En los dos últimos casos, el `.svg` original (la fuente para regenerar el
componente si se edita) vive en `assets/`, no en `public/` — no se sirve tal
cual, así que no pertenece ahí. Ver `assets/README.md`.

## Variantes de `DefaultLayout`

`DefaultLayout` acepta `centered` (booleano, por defecto `false`): centra su
`children` vertical y horizontalmente en el espacio entre cabecera y pie,
dentro de una tarjeta de ancho `--layout-form-width`. Pensado para pantallas de
un único formulario (registro, login...); el resto sigue fluyendo normal desde
arriba con el ancho de `--layout-max-width`. Ejemplo: `RegistroPage`.

## Anatomía de un componente

Cada componente vive en su propia carpeta con estos archivos:

- `NombreComponente.jsx` — el componente.
- `NombreComponente.module.css` — sus estilos (CSS Modules).
- `NombreComponente.test.jsx` — sus tests unitarios.
- `index.js` — *barrel* para poder importar `.../Button` en vez de `.../Button/Button`.

## Añadir un componente nuevo

1. Decide el nivel atómico que le corresponde.
2. Crea la carpeta dentro de ese nivel con los cuatro archivos de arriba.
3. Escribe el test junto al componente.
4. Importa solo de niveles inferiores.
5. Si usa estado/efectos/eventos, añade `'use client'` en la primera línea.

## Añadir una ruta nueva

1. Crea `app/mi-ruta/page.jsx`.
2. Que solo renderice la `page` de Atomic Design correspondiente
   (`src/components/pages/MiPantalla`).

## Integración con la API

- `src/api/` concentra las llamadas HTTP a los microservicios. Cada función
  devuelve un **resultado tipado** (`{ ok: true, data }` | `{ ok: false, error }`)
  en vez de lanzar; el organismo que la usa decide qué mostrar.
- El alta de usuario es **una sola llamada**: `POST /api/v1/registro` con
  `{ username, email, password }`. Es `chat-registro` quien crea la cuenta en
  Firebase Auth (Admin SDK) antes de guardar el perfil — este frontend no
  importa el SDK de Firebase ni le habla directamente para esto.
- La base URL sale de `NEXT_PUBLIC_API_BASE_URL` (inyectada en build; ver
  `.env.example`).
- Los errores del backend son *Problem Details* (RFC 9457): se ramifica por
  `error.type`, nunca por el código HTTP ni por textos. El `409` cubre tanto
  un duplicado local como uno ya existente en Firebase — el cliente no
  distingue el motivo.
- La validación de formularios vive en `src/utils/` como funciones puras
  (fácil de testear) y es **espejo** de las reglas del contrato, incluida la
  política de fortaleza de `password` — el contrato la exige igual. La
  autoritativa sigue siendo la del servidor.
- Detalle en [`integracion-api.md`](./integracion-api.md).
