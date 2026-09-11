# Chat — Frontend

Frontend del proyecto **Chat**, construido con **Next.js** (App Router) en modo
**export estático** y organizado según **Atomic Design**. Los tests unitarios se
hacen con **Jest** y **Testing Library** desde el inicio.

Vive en `chat-frontend/`, junto al resto de servicios del proyecto
(`chat-registro`, ...). Todo lo de este documento es relativo a esta carpeta.

## Por qué Next.js en modo estático

`next build` genera HTML/JS/CSS en `out/`, que se sirve tal cual con Nginx o una
CDN: **no hace falta un proceso Node en producción**. A cambio de esa
restricción (sin SSR, sin API routes, sin middleware en runtime) ganamos
enrutado por archivos, división de código y cero configuración de bundler.

## Requisitos

- Node.js >= 20
- npm >= 10

## Puesta en marcha

```bash
npm install
```

```bash
npm run dev
```

Servidor de desarrollo en `http://localhost:3000`.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo de Next (puerto 3000). |
| `npm run build` | Build + export estático a `out/`. |
| `npm run preview` | Sirve `out/` en local para revisar el build. |
| `npm run lint` | Stylelint sobre los `.css` (prohíbe color/tamaño literal). |
| `npm run lint:fix` | Igual, autocorrigiendo lo posible. |
| `npm test` | Ejecuta los tests con Jest. |
| `npm run test:watch` | Jest en modo watch. |
| `npm run test:coverage` | Informe de cobertura en `coverage/`. |

## Estructura

```
app/                          # App Router: solo enrutado
├── layout.jsx                # Layout raíz (html/body + tokens + CSS global)
├── page.jsx                  # "/"         -> <HomePage/>
├── registro/page.jsx         # "/registro" -> <RegistroPage/>
└── estilos/page.jsx          # "/estilos"  -> guía viva del sistema de diseño
src/
├── setupTests.js             # Setup de Jest
├── api/                      # Llamadas a los microservicios backend
│   ├── config.js             #   base URL (NEXT_PUBLIC_API_BASE_URL)
│   └── registro.js           #   POST /api/v1/registro
├── utils/                    # Helpers puros (validación de formularios...)
├── styles/
│   ├── tokens.css            # Tokens de diseño (color, tipografía, espaciado...)
│   └── global.css            # Reset y estilos base
└── components/               # Atomic Design
    ├── atoms/       Button, Input, Alert
    ├── molecules/   FormField, ThemeToggle, RequisitosCampo
    ├── organisms/   Header, RegistroForm
    ├── templates/   DefaultLayout
    └── pages/       HomePage, RegistroPage, StyleGuidePage
```

`app/` solo conecta URLs con componentes. Toda la UI y su lógica viven en
`src/components/` siguiendo Atomic Design. El alias `@/` apunta a `src/`.

Cada componente vive en su carpeta con `Componente.jsx`,
`Componente.module.css`, `Componente.test.jsx` e `index.js`.

## Atomic Design

```
atoms → molecules → organisms → templates → pages
```

Un componente solo importa de niveles **inferiores**. Detalle completo en
[`docs/arquitectura.md`](./docs/arquitectura.md).

## Sistema de diseño

Los estándares visuales son **tokens CSS** en `src/styles/tokens.css` (color,
tipografía, espaciado, radios, temas claro/oscuro). Ningún componente usa valores
literales — se referencian con `var(--token)` y `npm run lint` lo comprueba. Hay
una guía viva en [`/estilos`](http://localhost:3000/estilos) y la documentación
en [`docs/sistema-de-diseno.md`](./docs/sistema-de-diseno.md).

## Backend

La ruta `/registro` consume `POST /api/v1/registro` de **chat-registro**. La base
URL sale de `NEXT_PUBLIC_API_BASE_URL` (por defecto `http://localhost:8080`);
copia `.env.example` a `.env.local` para cambiarla. Detalle del patrón de
llamadas y manejo de errores en [`docs/integracion-api.md`](./docs/integracion-api.md).

## Tests

Toda pieza nueva se acompaña de su `*.test.jsx` en la misma carpeta. Estrategia
y convenciones en [`docs/testing.md`](./docs/testing.md).

## Documentación

La documentación del proyecto está en [`docs/`](./docs/). Empieza por
[`docs/README.md`](./docs/README.md).

## Stack

| Área | Herramienta |
|------|-------------|
| Framework / build | Next.js 16 (App Router, `output: 'export'`) |
| UI | React 19 |
| Estilos | CSS Modules + tokens de diseño (CSS custom properties) |
| Lint de estilos | Stylelint |
| Tests | Jest + Testing Library (vía `next/jest`) |
