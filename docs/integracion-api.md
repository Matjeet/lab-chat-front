# Integración con la API

Cómo consume este frontend los microservicios backend. Contrato completo:
[`../../chat-registro/docs/contratos-api.md`](../../chat-registro/docs/contratos-api.md).

## Configuración

| Variable | Por defecto | Notas |
|----------|-------------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL de `chat-registro`. Se **inyecta en tiempo de build** (export estático). Define en `.env.local` para desarrollo. |
| `NEXT_PUBLIC_FIREBASE_*` | — (obligatorias) | Config del proyecto de Firebase (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). Sin esto, todo registro falla en el paso de Firebase. Ver `.env.example`. |

`src/api/config.js` la lee y le quita la barra final. `src/firebase/config.js`
arma el objeto de configuración de Firebase con las suyas.

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
| `src/api/registro.js` | **Orquesta** el alta: Firebase → backend → (si hace falta) revertir Firebase. Es lo único que llama `RegistroForm`. |
| `src/firebase/config.js` | `FIREBASE_CONFIG` desde `NEXT_PUBLIC_FIREBASE_*`. |
| `src/firebase/client.js` | `obtenerAuth()` — getter perezoso de la instancia de Firebase Auth (ver "Firebase Auth" más abajo). |
| `src/firebase/auth.js` | `crearUsuarioFirebase` / `borrarUsuarioFirebase` — las llamadas crudas a Firebase. |
| `src/utils/validacionRegistro.js` | Validación de cliente + `requisitos{Username,Password}` (estado en vivo de cada requisito). |
| `src/components/organisms/RegistroForm/` | Estado del formulario + reparto de errores. |
| `src/components/pages/RegistroPage/` | Alterna formulario ↔ confirmación. |

## Firebase Auth

El alta de usuario ya no es una sola llamada al backend: es dos pasos
encadenados, orquestados por `registrarUsuario` en `src/api/registro.js`.

```
1. crearUsuarioFirebase({ email, password, username })
     -> Firebase Auth crea la identidad (createUserWithEmailAndPassword)
        y dejar sesión iniciada; el username se guarda como displayName
        (best-effort, no bloquea el alta si falla).
2. POST /api/v1/registro  { username, email, uid }
     -> chat-registro guarda username + email, enlazados por el uid de
        Firebase. La contraseña NO se envía — vive solo en Firebase.
```

- **La contraseña nunca llega al backend.** El campo sigue existiendo en el
  formulario y su política de fortaleza (ver más abajo) sigue aplicando
  porque Firebase la necesita para crear la cuenta.
- **`uid` es el identificador compartido** entre Firebase y la fila de
  `chat-registro`: es estable e inmutable, a diferencia del email.
- **Sesión**: `createUserWithEmailAndPassword` deja a la persona con sesión
  iniciada; no se cierra tras el alta (todavía no existe una pantalla de
  login separada — cerrarla la dejaría sin forma de entrar).
- **Rollback**: si el backend rechaza el alta (cualquier motivo — red, 400,
  409, 500), se borra el usuario recién creado en Firebase
  (`borrarUsuarioFirebase`) para no dejar una cuenta de Firebase sin fila
  correspondiente en la base de datos. Si ese borrado también falla, no hay
  más reintento — es un caso raro y queda así documentado.
- **SSR-safety**: `src/firebase/client.js` inicializa Firebase de forma
  perezosa (`obtenerAuth()`), nunca en el cuerpo del módulo. Con
  `output: 'export'`, Next prerenderiza en Node en build time — ahí no hay
  `window`, e inicializar el SDK de Auth en ese momento rompería `next build`.
- **Anti-enumeración, con una fuga real:** el backend responde `409`
  genérico a propósito para no confirmar si colisionó `username` o `email`
  (ver más abajo). Firebase, en cambio, sí distingue
  `auth/email-already-in-use` como error propio — lo traducimos al mismo
  `kind: 'duplicado'` genérico para que la UI no lo delate, pero alguien que
  inspeccione la red igual puede notar la diferencia de tráfico. Es una
  limitación conocida de usar el SDK de cliente de Firebase para el alta
  (no hay forma de evitarlo sin un backend propio delante de Firebase).

### ⚠️ El backend actual no acepta este contrato todavía

`chat-registro` (ver `contratos-api.md` §3.1) **sigue exigiendo `password`**
en el cuerpo y no conoce `uid`. Con el backend tal cual está hoy:

1. Firebase crea el usuario correctamente.
2. El `POST` a `/api/v1/registro` llega sin `password` → el backend responde
   `400 validation-error`.
3. Se revierte el alta en Firebase automáticamente (ver rollback arriba).
4. La persona ve el error genérico de "revisa los campos" sin haber quedado
   ninguna cuenta a medias — pero el registro **no se completa nunca**.

Hace falta actualizar `chat-registro` para que `POST /api/v1/registro`
acepte `{ username, email, uid }` (sin `password`) y guarde `uid` en la
entidad `Usuario`, antes de que este flujo funcione de punta a punta. Ese
cambio queda fuera de este repo (rama/backend aparte).

## Patrón: resultado tipado

Las funciones de `src/api/` **no lanzan**. Devuelven:

```js
{ ok: true,  data }                                  // 2xx del backend
{ ok: false, error: { kind: 'validacion', campos } } // Firebase o backend
{ ok: false, error: { kind: 'duplicado' } }          // Firebase o backend
{ ok: false, error: { kind: 'servidor' } }           // Firebase o backend
{ ok: false, error: { kind: 'red' } }                // fetch falló (sin red, CORS, caído)
```

El mismo vocabulario de `kind` sirve para los dos orígenes (Firebase y
backend) — `RegistroForm` no necesita saber cuál de los dos falló, solo
traduce el `kind` a UI. Las funciones de `src/firebase/` sí lanzan (dejan que
`registrarUsuario` las traduzca); solo las de `src/api/` devuelven el
resultado tipado.

El organismo hace `if (resultado.ok) … else switch (resultado.error.kind)`.

## Reglas de negociación de errores (del contrato §4)

1. **Ramificar por `type`**, no por `status` ni por `title`/`detail`.
2. **El `409` es genérico**: nunca se atribuye a un campo concreto ni se muestra
   el valor enviado (anti-enumeración). Mensaje neutro en la UI.
3. **`password` nunca se guarda ni se muestra** tras el alta — ni siquiera se
   envía al backend; solo la ve Firebase.
4. **El `email` se normaliza a minúsculas** en el servidor; al mostrarlo tras el
   alta se usa el valor de la respuesta, no el tecleado.
5. **Validación de cliente = espejo** de las reglas, solo para feedback
   inmediato. En un `400`, los textos que se muestran salen de `REGLAS[campo]`
   (nuestros), no del `message` del servidor (orientativo).
   **Excepción: `password`.** El cliente exige además una política de
   fortaleza (mayúscula, minúscula, número, especial, sin repetición 4+ y
   máximo 20 caracteres) que el contrato **no** exige — el backend solo valida
   8–100 caracteres. Es una capa extra solo en este frontend; si se quiere
   igual de estricta en el servidor, es un cambio aparte en `chat-registro`.
6. **La unicidad no se puede pre-comprobar** (no hay endpoint): se descubre con
   el `409` del `POST`.

## Añadir una llamada nueva

1. Función en `src/api/<servicio>.js` que devuelve el resultado tipado.
2. Si hay formulario, validación pura en `src/utils/`.
3. El organismo consume la función y traduce cada `kind` a UI.
4. Tests: mockear `src/api/<servicio>` en el test del organismo; testear la
   función de API aparte con `global.fetch = jest.fn()`.
