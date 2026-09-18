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
| `src/components/pages/RegistroPage/` | Alterna formulario ↔ confirmación. También navega a `/home` si ya hay sesión, antes de mostrar el formulario (mismo criterio que `LoginPage`). |
| `src/utils/validacionLogin.js` | Validación de cliente del login: email válido, contraseña no vacía. Sin política de fortaleza — no aplica a una cuenta ya existente. |
| `src/firebase/config.js` | Inicializa el SDK de cliente de Firebase (variables `NEXT_PUBLIC_FIREBASE_*`). |
| `src/firebase/auth.js` | `iniciarSesion({email, password})` + `observarSesion(callback)` → Firebase Authentication (Email/Password). |
| `src/hooks/useRequiereSesion.js` | Hook para pantallas que exigen sesión: `{ verificando }`, navega a `/login` si no hay usuario. |
| `src/hooks/useRedirigirSiHaySesion.js` | Hook inverso, para pantallas públicas: `{ comprobando }`, navega a `/home` si SÍ hay usuario. |
| `src/components/organisms/LoginForm/` | Formulario de login: valida, llama a `onIniciarSesion` y muestra el aviso según `error.kind` si falla. |
| `src/components/pages/LoginPage/` | Monta `LoginForm`, le pasa `onIniciarSesion` (llama a `iniciarSesion` y navega a `/home` si sale bien) + enlace a `/registro`. También navega a `/home` si ya hay sesión, antes de mostrar el formulario. |
| `src/components/pages/HomePage/` | En `/home`, destino tras un login correcto — el chat 1 a 1 en sí (ver [`integracion-conversacion.md`](./integracion-conversacion.md)). Exige sesión (`useRequiereSesion`). |
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
`observarSesion`): si ya hay un usuario, navega a `/home` con
`router.replace` (no `push`, para no dejar en el historial una pantalla de
login que nunca llegó a usarse).

**Esto no bloquea el render.** El formulario se pinta siempre, de inmediato
— nada aquí necesita esperar una respuesta de red (es export estático, todo
el HTML/JS/CSS ya está descargado). La comprobación de sesión es siempre
asíncrona, pero como la mayoría de las veces quien entra a `/` no tiene
sesión todavía, demorar la carga de toda la pantalla para cubrir el caso
contrario no compensa — ver más abajo "Por qué no se retrasa la carga".

**Pendiente, a propósito:** qué hacer con el `idToken` frente a
`chat-registro` (¿lo valida un endpoint nuevo? ¿el backend confía en Firebase
y solo le importa el `uid`?) — `HomePage` hoy no recibe ni usa ese token, es
solo la confirmación visual de que el login funcionó.

## Rutas que exigen sesión

`/` y `/login` (la misma `LoginPage`) y `/registro` son las únicas rutas
públicas — no exigen sesión para verse. Cualquier otra —hoy `/home` y
`/estilos`— exige una sesión de Firebase activa: usa el hook
`useRequiereSesion` (`src/hooks/`), que envuelve `observarSesion` en sentido
contrario a como lo usan `LoginPage`/`RegistroPage`:

Ojo, "pública" no significa "sin ningún chequeo de sesión": tanto `LoginPage`
como `RegistroPage` comprueban si YA hay sesión y, si la hay, navegan a
`/home` en vez de mostrarse — no tiene sentido pedir credenciales o crear
otra cuenta si ya se está dentro. Es el criterio inverso al de abajo, con
`useRedirigirSiHaySesion` en vez de `useRequiereSesion`.

```jsx
useRequiereSesion(); // navega a /login en segundo plano si no hay sesión
return <DefaultLayout ...>{/* contenido real, siempre */}</DefaultLayout>;
```

### Por qué no se retrasa la carga con un estado "Comprobando sesión…"

Los cuatro hooks-usuario (`LoginPage`/`RegistroPage` con
`useRedirigirSiHaySesion`, `HomePage`/`StyleGuidePage` con
`useRequiereSesion`) **no bloquean el render** a propósito: la pantalla pinta
su contenido real desde el primer momento y la redirección, si hace falta,
ocurre en segundo plano en cuanto la comprobación resuelve — normalmente tan
rápido que no llega a percibirse ningún parpadeo (Firebase ya tiene el
estado de sesión en memoria salvo la primerísima carga de la pestaña). Se
descartó a propósito un estado de carga intermedio (hubo uno,
`CargandoSesion`, con un aviso "Comprobando sesión…"): forzaba una demora
visible en el caso común (la mayoría de las visitas a `/` no tienen sesión;
la mayoría a `/home` sí la tienen) solo para cubrir mejor el caso raro. El
resultado ahora es más rápido a costa de mostrar, en el caso raro
(sesión activa en `/`, o sin sesión en `/home`), el contenido "equivocado"
durante un instante antes de redirigir — un costo aceptable porque ese
contenido nunca es sensible (ver el aviso de seguridad justo abajo).

**Importante — esto es una guardia de UX, no un límite de seguridad.** El
export estático (`output: 'export'`) no tiene servidor: `out/home.html` es un
archivo público como cualquier otro, descargable sin pasar por React ni por
`useRequiereSesion` — el guard solo actúa una vez que el JS carga en el
navegador. `useRequiereSesion` evita que alguien sin sesión *use* la
pantalla; no reemplaza la autorización del lado del servidor para los datos
que esa pantalla vaya a pedir — esos datos **no pueden depender de que el
cliente decida ocultarlos**, tienen que venir de una llamada a un backend
que exija sus propias credenciales (el `idToken`, un header, lo que decida
el contrato).

Esto ya dejó de ser hipotético: `HomePage` ahora es el chat (ver
[`integracion-conversacion.md`](./integracion-conversacion.md)) y sí muestra
datos reales — mensajes de `chat-conversacion`. Ese servicio **todavía no
tiene autenticación propia** (su contrato lo avisa explícitamente): cualquiera
que sepa la URL puede pedir el historial de cualquier par de usuarios o
conectarse al WebSocket con cualquier `{usuario}`, sin pasar por Firebase ni
por nada de este frontend. `useRequiereSesion` en `HomePage` solo impide
llegar a la pantalla sin sesión de *este* frontend — no protege los mensajes
en sí, que siguen expuestos a quien hable directo con `chat-conversacion`.
Sigue siendo, a propósito, una demo de la conexión — no algo listo para datos
reales hasta que `chat-conversacion` resuelva su propia autenticación.

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
