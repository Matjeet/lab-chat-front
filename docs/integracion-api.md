# Integración con la API

Cómo consume este frontend los microservicios backend. Contrato completo:
[`../../chat-registro/docs/contratos-api.md`](../../chat-registro/docs/contratos-api.md).

## Configuración

| Variable | Por defecto | Notas |
|----------|-------------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL de `chat-registro`. Se **inyecta en tiempo de build** (export estático). Define en `.env.local` para desarrollo. |

`src/api/config.js` la lee y le quita la barra final.

### CORS

`chat-registro` habilita CORS él mismo para `/api/**` (`CorsConfig` +
`CORS_ALLOWED_ORIGINS`, ver contrato §1) — ya no lo resuelve un gateway.

- **Desarrollo**: el valor por defecto del backend es `http://localhost:3000`,
  que coincide con `npm run dev`. No hace falta tocar nada.
- **Producción**: quien despliegue `chat-registro` debe incluir el origen real
  donde se sirve `out/` (el dominio, con esquema y puerto, sin barra final) en
  `CORS_ALLOWED_ORIGINS`. Sin eso, toda petición del frontend falla.
- **Un origen no permitido responde `403` sin cabeceras `Access-Control-*`**:
  el navegador bloquea la lectura de la respuesta y `fetch` lanza — nuestro
  código ya lo captura como `{ kind: 'red' }` (ver más abajo), así que en la UI
  se ve igual que "no se pudo conectar". Si aparece ese mensaje con el backend
  arriba, revisa la consola del navegador (error de CORS) y
  `CORS_ALLOWED_ORIGINS` antes de asumir que es un problema de red.
- No enviamos cookies/credenciales (`fetch` sin `credentials`), consistente con
  `CORS_ALLOW_CREDENTIALS=false` por defecto en el backend.

## Dónde vive el código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/api/config.js` | `API_BASE_URL`. |
| `src/api/registro.js` | `registrarUsuario(datos)` → `POST /api/v1/registro`. Es lo único que llama `RegistroForm`. |
| `src/utils/validacionRegistro.js` | Validación de cliente + `requisitos{Username,Password}` (estado en vivo de cada requisito). |
| `src/components/organisms/RegistroForm/` | Estado del formulario + reparto de errores. |
| `src/components/pages/RegistroPage/` | Alterna formulario ↔ confirmación. |
| `src/utils/validacionLogin.js` | Validación de cliente del login: email válido, contraseña no vacía. Sin política de fortaleza — no aplica a una cuenta ya existente. |
| `src/firebase/config.js` | Inicializa el SDK de cliente de Firebase (variables `NEXT_PUBLIC_FIREBASE_*`). |
| `src/firebase/auth.js` | `iniciarSesion({email, password})` + `observarSesion(callback)` → Firebase Authentication (Email/Password). |
| `src/hooks/useRequiereSesion.js` | Hook para pantallas que exigen sesión: `{ verificando }`, navega a `/login` si no hay usuario. |
| `src/hooks/useRedirigirSiHaySesion.js` | Hook inverso, para pantallas públicas: `{ comprobando }`, navega a `/home` si SÍ hay usuario. |
| `src/components/templates/CargandoSesion/` | Plantilla compartida (`LoginPage`, `HomePage`, `StyleGuidePage`) mientras se resuelve cualquiera de los dos hooks — mismo aspecto en las tres, a propósito (ver más abajo). |
| `src/components/organisms/LoginForm/` | Formulario de login: valida, llama a `onIniciarSesion` y muestra el aviso según `error.kind` si falla. |
| `src/components/pages/LoginPage/` | Monta `LoginForm`, le pasa `onIniciarSesion` (llama a `iniciarSesion` y navega a `/home` si sale bien) + enlace a `/registro`. También navega a `/home` si ya hay sesión, antes de mostrar el formulario. |
| `src/components/pages/HomePage/` | Destino tras un login correcto. Exige sesión (`useRequiereSesion`). Placeholder: solo confirma la sesión, sin contenido real todavía. |
| `src/components/pages/StyleGuidePage/` | Guía de estilo. Exige sesión (`useRequiereSesion`) — no es pública. |

## Quién habla con Firebase

**Depende de la operación — y es a propósito, no una inconsistencia:**

- **Alta de usuario**: nadie, en este frontend. Es una única llamada,
  `POST /api/v1/registro` con `{ username, email, password }`; es
  **`chat-registro`** quien crea la cuenta en Firebase Auth (Admin SDK) antes
  de guardar el perfil. El cliente nunca ve un `uid` ni un proveedor, y no
  importa el SDK de Firebase para esto.
- **Inicio de sesión**: sí, este frontend, con el **SDK de cliente** de
  Firebase Authentication (`firebase/auth`, `signInWithEmailAndPassword`) —
  ver `src/firebase/auth.js`. No hay endpoint de login en `chat-registro`;
  el frontend valida las credenciales directamente contra Firebase.

> Este proyecto tuvo, brevemente, una versión donde el frontend también creaba
> el usuario en Firebase (con el SDK de cliente) durante el **alta**, y
> mandaba el `uid` al backend. Se revirtió por decisión explícita: el backend
> pasó a orquestar la creación en Firebase él mismo para el alta. El SDK de
> cliente que existe ahora en `src/firebase/` es una integración **distinta e
> independiente** de aquella — solo para login, nunca para crear cuentas.

## Login — conectado a Firebase Authentication

`LoginForm` valida en cliente (email con formato válido, contraseña no vacía)
y llama a `onIniciarSesion(datos)` con `{ email, password }` ya normalizados.
`LoginPage` le pasa una función que:

1. Llama a `iniciarSesion(datos)` (`src/firebase/auth.js`), que envuelve
   `signInWithEmailAndPassword` con el mismo patrón de resultado tipado que
   `src/api/*.js`: `{ ok: true, data: {uid, email, idToken} }` o
   `{ ok: false, error: { kind } }` con `kind` en
   `credenciales | demasiados-intentos | red | desconocido`.
2. Si `ok: true`, navega a `/home` (`useRouter().push`, App Router).
3. Devuelve el resultado a `LoginForm`, que si `ok: false` muestra el aviso
   correspondiente a `error.kind` (un solo mensaje genérico para
   `credenciales` — igual que el `409` de registro, nunca se distingue si
   falló el email o la contraseña).

### Ya con sesión activa, `/login` no vuelve a pedir credenciales

Firebase persiste la sesión solo en el navegador (no es cosa de esta app). Al
montarse, `LoginPage` usa `useRedirigirSiHaySesion` (`src/hooks/`, envuelve
`observarSesion`) antes de pintar nada: si ya hay un usuario, navega a
`/home` con `router.replace` (no `push`, para no dejar en el historial una
pantalla de login que nunca llegó a usarse) sin mostrar el formulario ni un
instante; si no hay sesión, recién ahí se pinta. Como esa comprobación es
siempre asíncrona (nunca se sabe de forma síncrona al cargar la página),
mientras se resuelve se muestra `CargandoSesion` en vez del formulario — ver
más abajo "Por qué no se percibe como un parpadeo".

**Pendiente, a propósito:** qué hacer con el `idToken` frente a
`chat-registro` (¿lo valida un endpoint nuevo? ¿el backend confía en Firebase
y solo le importa el `uid`?) — `HomePage` hoy no recibe ni usa ese token, es
solo la confirmación visual de que el login funcionó.

## Rutas que exigen sesión

`/` y `/login` (la misma `LoginPage`) y `/registro` son las únicas rutas
públicas. Cualquier otra —hoy `/home` y `/estilos`— exige una sesión de
Firebase activa: usa el hook `useRequiereSesion` (`src/hooks/`), que envuelve
`observarSesion` en sentido contrario a como lo usa `LoginPage`:

```jsx
const { verificando } = useRequiereSesion(); // navega a /login si no hay sesión

if (verificando) return <CargandoSesion />;
return <DefaultLayout ...>{/* contenido real */}</DefaultLayout>;
```

`verificando` solo pasa a `false` cuando SÍ hay un usuario autenticado —
mientras es `true`, la pantalla no debe pintar su contenido real (ni un
`return null`, tampoco: eso dejaría la página en blanco un instante antes de
redirigir en vez de mostrar el mismo aviso que usa `LoginPage`).

### Por qué la redirección `/` ↔ `/home` no se percibe como un parpadeo

`LoginPage` (con `useRedirigirSiHaySesion`) y `HomePage`/`StyleGuidePage`
(con `useRequiereSesion`) resuelven casos opuestos, pero mientras están
comprobando muestran **la misma plantilla**: `CargandoSesion`
(`src/components/templates/`) — `DefaultLayout title="Chat" centered` +
`Alert tipo="info">Comprobando sesión…`, sin `tarjeta` ni fondo animado, en
las tres. Es a propósito: cuando alguien con sesión activa entra a `/`, lo
que ve es `CargandoSesion` → `router.replace('/home')` → `CargandoSesion`
(de `HomePage`, mientras confirma lo mismo) → el contenido real. Como el
paso intermedio es **pixel a pixel idéntico** a ambos lados de la
navegación, el cambio de ruta no se nota — lo único que cambia en pantalla
es, una sola vez, al llegar al destino final. Si `CargandoSesion` cambia
(texto, layout), cambia igual en las tres pantallas que la usan; si una
necesitara verse distinta ahí, ya no cumpliría este propósito y no debería
usarla.

**Importante — esto es una guardia de UX, no un límite de seguridad.** El
export estático (`output: 'export'`) no tiene servidor: `out/home.html` es un
archivo público como cualquier otro, descargable sin pasar por React ni por
`useRequiereSesion` — el guard solo actúa una vez que el JS carga en el
navegador. Hoy no importa (`HomePage` no tiene datos reales todavía), pero
en cuanto una pantalla protegida muestre algo sensible, ese dato **no puede
depender de que el cliente decida ocultarlo** — tiene que venir de una
llamada a un backend que exija sus propias credenciales (el `idToken`, un
header, lo que decida el contrato). `useRequiereSesion` evita que alguien sin
sesión *use* la pantalla; no reemplaza la autorización del lado del
servidor para los datos que esa pantalla vaya a pedir.

## Patrón: resultado tipado

Las funciones de `src/api/` **no lanzan**. Devuelven:

```js
{ ok: true,  data }                                  // 2xx
{ ok: false, error: { kind: 'validacion', campos } } // 400 validation-error
{ ok: false, error: { kind: 'duplicado' } }          // 409 duplicate / data-integrity
{ ok: false, error: { kind: 'servidor' } }           // 5xx u otros
{ ok: false, error: { kind: 'red' } }                // fetch falló (sin red, CORS, caído)
```

El organismo hace `if (resultado.ok) … else switch (resultado.error.kind)`.

## Reglas de negociación de errores (del contrato §4)

1. **Ramificar por `type`**, no por `status` ni por `title`/`detail`.
2. **El `409` es genérico**: nunca se atribuye a un campo concreto ni se muestra
   el valor enviado (anti-enumeración). Cubre username/email duplicados **y**
   un email ya existente en Firebase — el cliente no distingue el motivo.
   Mensaje neutro en la UI.
3. **`password` nunca se guarda ni se muestra** tras el alta. El backend
   tampoco la persiste: solo la reenvía a Firebase.
4. **El `email` se normaliza a minúsculas** en el servidor; al mostrarlo tras el
   alta se usa el valor de la respuesta, no el tecleado.
5. **Validación de cliente = espejo** de las reglas del contrato, solo para
   feedback inmediato — incluida la política de fortaleza de `password`
   (mayúscula, minúscula, número, especial, sin repetición 4+, 8–20
   caracteres): el contrato la exige igual, byte a byte. La autoritativa
   sigue siendo la del servidor; en un `400` los textos que se muestran salen
   de `REGLAS[campo]` (nuestros), no del `message` del servidor (orientativo).
6. **La unicidad no se puede pre-comprobar** (no hay endpoint): se descubre con
   el `409` del `POST`.

## Añadir una llamada nueva

1. Función en `src/api/<servicio>.js` que devuelve el resultado tipado.
2. Si hay formulario, validación pura en `src/utils/`.
3. El organismo consume la función y traduce cada `kind` a UI.
4. Tests: mockear `src/api/<servicio>` en el test del organismo; testear la
   función de API aparte con `global.fetch = jest.fn()`.
