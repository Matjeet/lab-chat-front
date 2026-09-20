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
| `app/page.jsx` | Ruta `/`. Solo hace `return <LoginPage/>` — la app arranca en el login. |

Toda la interfaz y su lógica viven en `src/components/` siguiendo Atomic Design.
Añadir una pantalla nueva = crear `app/ruta/page.jsx` que renderiza la `page`
correspondiente de Atomic Design.

### Client vs. Server Components

Los componentes del App Router son Server Components por defecto. Un componente
que use estado, efectos o handlers de eventos necesita `'use client'` en la
primera línea (p. ej. `RegistroForm`, `LoginForm`). Sus hijos heredan el modo
cliente.

Un valor que debe cambiar en cada apertura/recarga (p. ej. `TextoAleatorio`,
que sortea una frase distinta cada vez que se monta) **no puede** sortearse
durante el render: en export estático el HTML sale fijado desde el build, así
que un `Math.random()` ahí produciría un mismatch de hidratación entre ese
HTML y lo que calcula el navegador. El patrón correcto (mismo que ya usa
`ThemeToggle` para leer `localStorage`): estado inicial fijo e igual en build
y cliente, y el valor real se calcula en un `useEffect` — así el primer
render coincide siempre y el cambio ocurre ya en el navegador, sin conflicto.

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
| **pages** | Plantilla + datos + lógica reales. | `LoginPage` |

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
├── public/                    # Estáticos servidos tal cual (URL "/archivo.ext")
│   └── chat-logo.webp         # Logo de marca, usado por Header
├── app/                       # App Router (solo enrutado)
│   ├── favicon.ico            # Archivo especial de convención: Next.js lo detecta solo
│   ├── layout.jsx             # html/body + tokens + global.css + tema inicial
│   ├── page.jsx               # "/"         -> <LoginPage/> (arranque de la app)
│   ├── registro/page.jsx      # "/registro" -> <RegistroPage/>
│   ├── login/page.jsx         # "/login"    -> <LoginPage/> (misma pantalla que "/")
│   ├── home/page.jsx          # "/home"     -> <HomePage/> (destino tras login: el chat 1 a 1)
│   ├── estilos/page.jsx       # "/estilos"  -> <StyleGuidePage/> (guía viva)
│   └── not-found.jsx          # 404 (ruta inexistente o notFound()) -> <NotFoundPage/>
├── src/
│   ├── setupTests.js          # Setup global de Jest (matchers de jest-dom)
│   ├── api/                   # Acceso a los servicios backend
│   │   ├── config.js          # API_BASE_URL (NEXT_PUBLIC_API_BASE_URL)
│   │   ├── registro.js        # POST /api/v1/registro -> resultado tipado
│   │   └── usuario.js         # GET /api/v1/usuarios/{uid} (autenticado) -> resultado tipado
│   ├── firebase/               # SDK de cliente de Firebase (solo login, ver integracion-api.md)
│   │   ├── config.js           # Inicializa la app (variables NEXT_PUBLIC_FIREBASE_*)
│   │   └── auth.js             # iniciarSesion(...) + observarSesion(cb) -> resultado tipado
│   ├── conversacion/            # Acceso al chat en tiempo real, vía chat-gateway (ver integracion-conversacion.md)
│   │   ├── config.js            # urlSocketConversacion(usuario), sobre API_BASE_URL
│   │   └── historial.js         # GET /api/v1/conversaciones/{a}/{b} -> resultado tipado
│   ├── context/                 # Contextos de React (estado compartido entre páginas)
│   │   └── InterlocutorContext.jsx # {con, establecerCon}; lo escribe SelectorInterlocutor, lo lee HomePage
│   ├── hooks/                   # Hooks compartidos (no encajan en Atomic Design)
│   │   ├── useRequiereSesion.js # {verificando}; navega a /login si no hay sesión
│   │   ├── useRedirigirSiHaySesion.js # {comprobando}; navega a /home si SÍ hay sesión
│   │   ├── useMiUsuario.js      # {yo, establecerYo}; localStorage + GET /api/v1/usuarios/{uid}
│   │   └── useConversacion.js   # historial + WebSocket de una conversación 1 a 1
│   ├── utils/                  # Helpers puros (sin React)
│   │   ├── validacionRegistro.js
│   │   ├── validacionLogin.js
│   │   ├── validacionConversacion.js
│   │   └── miUsuario.js         # localStorage: recuerda el username (ver integracion-conversacion.md)
│   ├── styles/
│   │   ├── tokens.css         # Tokens de diseño (ver sistema-de-diseno.md)
│   │   └── global.css         # Reset y estilos base
│   └── components/
│       ├── atoms/             Button · Input · Alert · Ilustracion404 · PatronBurbujas ·
│       │                      TextoAleatorio · BurbujaMensaje
│       ├── molecules/         FormField · ThemeToggle · RequisitosCampo · CampoMensaje ·
│       │                      SelectorInterlocutor
│       ├── organisms/         Header · RegistroForm · LoginForm · Conversacion
│       ├── templates/         DefaultLayout
│       └── pages/             LoginPage · RegistroPage · HomePage · StyleGuidePage · NotFoundPage
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
  para algo estático en export mode. Ejemplo real: `public/chat-logo.webp`,
  el logo de la marca en `Header` — su degradado es fijo, no cambia con el
  tema, así que no hace falta inlinearlo.
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

Dos props booleanas, independientes:

- **`centered`** (por defecto `false`): centra `children` vertical y
  horizontalmente en el espacio entre cabecera y pie, dentro de un contenedor
  de ancho `--layout-form-width`. Sin esto, el contenido fluye normal desde
  arriba con el ancho de `--layout-max-width`.
- **`tarjeta`** (por defecto `false`, solo tiene efecto junto a `centered`):
  además, pone ese contenedor dentro de una **tarjeta visual** — fondo sólido
  (`--color-surface`), borde, esquinas redondeadas y sombra — y añade
  `PatronBurbujas`: un fondo animado que cubre **toda la pantalla** (va en
  `.layout`, detrás de cabecera, contenido y pie — no solo detrás de la
  tarjeta). Cabecera y pie llevan su propio `--color-surface` de fondo para
  no dejar pasar la animación por transparencia, ver `sistema-de-diseno.md`.

Pensadas para pantallas de un único formulario. `LoginPage`/`RegistroPage`
usan las dos (formulario en tarjeta sobre el patrón animado); `NotFoundPage`
usa solo `centered` — su ilustración ya tiene su propio fondo pensado para
fundirse con la página, así que no lleva `tarjeta`.

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
- **Login (`LoginForm`) valida en cliente** (email válido, contraseña no
  vacía; a propósito *sin* la política de fortaleza de registro, no aplica a
  una cuenta ya existente) y llama a `onIniciarSesion(datos)`. `LoginPage` le
  pasa una función que habla con el **SDK de cliente de Firebase
  Authentication** (`src/firebase/auth.js`, no un endpoint de
  `chat-registro`: no existe ninguno de login) y, si sale bien, navega a
  `/home`. Sin `onIniciarSesion`, `LoginForm` se limita a avisar que falta
  conectar el backend — así sigue sirviendo como pantalla standalone en los
  tests que no la conectan.
- **`LoginPage` y `RegistroPage` también comprueban si ya hay sesión**
  (`useRedirigirSiHaySesion`, `src/hooks/`) — si la hay, no tiene sentido
  pedir credenciales o crear otra cuenta: navegan a `/home` con
  `router.replace`. **No bloquea el render**: el formulario se pinta siempre
  de inmediato (nada necesita esperar un fetch); la redirección, si hace
  falta, ocurre en segundo plano tan pronto la comprobación resuelve — no
  hay un estado de carga intermedio ("Comprobando sesión…") a propósito,
  para no demorar la carga en el caso común (la mayoría de las visitas a `/`
  no tienen sesión todavía). Ver
  [`integracion-api.md`](./integracion-api.md#por-qué-no-se-retrasa-la-carga-con-un-estado-comprobando-sesión).
- **Toda ruta que no sea `/`, `/login` o `/registro` exige sesión** —hoy
  `/home` y `/estilos`— vía el hook `useRequiereSesion` (`src/hooks/`, mismo
  mecanismo que `LoginPage` pero en sentido contrario). Es una guardia
  de **UX en el cliente**, no un límite de seguridad: en export estático el
  HTML de esas rutas es un archivo público igual que cualquier otro, el
  guard solo actúa cuando el JS ya cargó en el navegador. El día que una
  pantalla protegida muestre datos reales, esos datos deben venir de una
  llamada a un backend que los autorice él mismo — ver
  [`integracion-api.md`](./integracion-api.md#rutas-que-exigen-sesión).
- **`/home` (`HomePage`) es el chat en sí**, conectado de verdad a
  `chat-conversacion` (WebSocket en tiempo real + REST para el historial) —
  detalle completo en
  [`integracion-conversacion.md`](./integracion-conversacion.md).
- Detalle en [`integracion-api.md`](./integracion-api.md).
