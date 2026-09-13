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
| `src/components/organisms/LoginForm/` | Formulario de login. **No llama a ningún servicio todavía** (ver más abajo). |
| `src/components/pages/LoginPage/` | Monta `LoginForm` + enlace a `/registro`. |

## Quién habla con Firebase

**Nadie, en este frontend — y así debe quedar por ahora.** El registro es una
única llamada: `POST /api/v1/registro` con `{ username, email, password }`.
Es **`chat-registro`** quien crea la cuenta en Firebase Auth (Admin SDK) antes
de guardar el perfil; el cliente nunca ve un `uid` ni un proveedor, y no
importa el SDK de Firebase para esto.

> Este proyecto sí tuvo, brevemente, una versión donde el frontend creaba el
> usuario en Firebase con el SDK de cliente y mandaba el `uid` al backend
> (`src/firebase/`, ya eliminado). Se revirtió por decisión explícita: el
> backend pasó a orquestar la creación en Firebase él mismo. Si en el futuro
> hace falta el SDK de Firebase en el cliente (login, sesión...), es una
> integración nueva e independiente de este alta — no revivir `src/firebase/`
> solo para esto.

## Login — solo UI/UX por ahora

`LoginForm` existe y valida (email con formato válido, contraseña no vacía),
pero **no hay endpoint de login todavía**, así que no llama a `src/api/`. Su
prop `onIniciarSesion(datos)`, si se pasa, recibe `{ email, password }` ya
validados y normalizados; sin ella, el propio formulario muestra un aviso de
que falta conectar el backend — para que se pueda revisar/usar la pantalla ya
mismo sin fingir un inicio de sesión real.

Cuando exista el contrato del endpoint de login:

1. Crear `src/api/login.js` con el mismo patrón de resultado tipado que
   `registro.js` (probablemente `{ ok, data }` con un token de sesión, o lo
   que defina el contrato).
2. `LoginPage` pasa `onIniciarSesion` a `LoginForm`, llamando a esa función y
   decidiendo qué hacer con el resultado (redirigir, guardar el token,
   mostrar el error) — no hace falta tocar `LoginForm` para esto.
3. Si el login devuelve algo tipo Problem Details, reutilizar
   `mapearErrorBackend`-style: ramificar por `type`, no por `status`.

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
