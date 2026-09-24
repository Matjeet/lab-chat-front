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
assets/                       # Fuentes de diseño a inlinear/procesar a mano (ver su README)
public/                       # Estáticos servidos tal cual (logo...)
app/                          # App Router: solo enrutado
├── layout.jsx                # Layout raíz (html/body + tokens + CSS global)
├── favicon.ico                # Archivo especial de convención de Next.js
├── page.jsx                  # "/"         -> <LoginPage/> (arranque de la app)
├── login/page.jsx            # "/login"    -> <LoginPage/> (misma pantalla que "/")
├── registro/page.jsx         # "/registro" -> <RegistroPage/>
├── home/page.jsx              # "/home"     -> <HomePage/> (destino tras login: el chat 1 a 1, exige sesión)
├── estilos/page.jsx          # "/estilos"  -> guía viva del sistema de diseño (exige sesión)
└── not-found.jsx             # 404 -> <NotFoundPage/> (se exporta como out/404.html)
src/
├── setupTests.js             # Setup de Jest
├── api/                      # Llamadas a chat-gateway
│   ├── config.js             #   base URL (NEXT_PUBLIC_API_BASE_URL)
│   ├── registro.js           #   POST /api/v1/registro
│   └── usuario.js            #   GET /api/v1/usuarios/{uid} y /existe (autenticados)
├── firebase/                  # SDK de cliente de Firebase Authentication (solo login)
│   ├── config.js
│   └── auth.js                #   iniciarSesion(...) + observarSesion(cb)
├── conversacion/               # Llamadas al chat (WebSocket + historial REST + lista de chats), vía chat-gateway
│   ├── config.js
│   ├── historial.js
│   └── listaChats.js
├── context/                    # InterlocutorContext: con quién se está chateando ahora
├── hooks/                      # useRequiereSesion, useRedirigirSiHaySesion, useMiUsuario, useListaChats, useExisteUsuario, useConversacion
├── utils/                     # Helpers puros (validación de formularios, miUsuario...)
├── styles/
│   ├── tokens.css            # Tokens de diseño (color, tipografía, espaciado...)
│   └── global.css            # Reset y estilos base
└── components/               # Atomic Design
    ├── atoms/       Button, Input, Alert, Ilustracion404, PatronBurbujas, TextoAleatorio,
    │                BurbujaMensaje, ItemChat
    ├── molecules/   FormField, ThemeToggle, RequisitosCampo, CampoMensaje, SelectorInterlocutor
    ├── organisms/   Header, RegistroForm, LoginForm, Conversacion, ListaChats
    ├── templates/   DefaultLayout
    └── pages/       LoginPage, RegistroPage, HomePage, StyleGuidePage, NotFoundPage
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

La ruta `/registro` consume `POST /api/v1/registro` de **chat-gateway** (que
reenvía por gRPC a `chat-registro`) con `{ username, email, password }`. Es
el backend quien crea la cuenta en Firebase Auth antes de guardar el perfil
— este frontend no habla con Firebase directamente para el alta. Copia
`.env.example` a `.env.local` para configurar `NEXT_PUBLIC_API_BASE_URL`.

La ruta `/login` sí habla con **Firebase Authentication** directamente (SDK
de cliente, `src/firebase/auth.js`) — no hay endpoint de login en
chat-registro. `/`, `/login` y `/registro` redirigen a `/home` si ya hay
sesión; cualquier otra ruta (`/home`, `/estilos`) exige sesión y redirige a
`/login` si no la hay.

**`/home` es el chat en sí** — el destino tras iniciar sesión — conectado de
verdad a **chat-conversacion vía chat-gateway**: WebSocket en tiempo real +
REST para el historial, ambos contra el gateway (mismo origen que
`NEXT_PUBLIC_API_BASE_URL`). "Tu usuario" se resuelve solo con `GET
/api/v1/usuarios/{uid}` (autenticado, `idToken` de la sesión activa) en
cuanto hay sesión; si ese backend no resuelve, cae a un formulario manual
como respaldo. Dos columnas: a la izquierda, `ListaChats` — con quién se ha
hablado y el último mensaje de cada uno, scroll infinito, `GET
/api/v1/conversaciones/{usuario}/chats` —; a la derecha, la conversación
elegida. Para empezar un chat nuevo desde la cabecera, antes se comprueba
que el username exista de verdad (`GET /api/v1/usuarios/existe`) — si no
existe, o si la comprobación falla, avisa y no lo abre. Detalle en
[`docs/integracion-conversacion.md`](./docs/integracion-conversacion.md).

Detalle del patrón de llamadas y manejo de errores en
[`docs/integracion-api.md`](./docs/integracion-api.md).

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
