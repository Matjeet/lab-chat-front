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
| `src/firebase/auth.js` | `iniciarSesion({email, password})` → Firebase Authentication (Email/Password). Es lo único que llama `LoginPage`. |
| `src/components/organisms/LoginForm/` | Formulario de login: valida, llama a `onIniciarSesion` y muestra el aviso según `error.kind` si falla. |
| `src/components/pages/LoginPage/` | Monta `LoginForm`, le pasa `onIniciarSesion` (llama a `iniciarSesion` y navega a `/home` si sale bien) + enlace a `/registro`. |
| `src/components/pages/HomePage/` | Destino tras un login correcto. Placeholder: solo confirma la sesión, sin contenido real todavía. |

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

**Pendiente, a propósito:** qué hacer con el `idToken` frente a
`chat-registro` (¿lo valida un endpoint nuevo? ¿el backend confía en Firebase
y solo le importa el `uid`?) — `HomePage` hoy no recibe ni usa ese token, es
solo la confirmación visual de que el login funcionó. Tampoco hay protección
de ruta: `/home` es accesible sin haber iniciado sesión. Ambas cosas dependen
de esa decisión, todavía sin tomar.

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
