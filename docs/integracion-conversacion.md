# Integración con chat-conversacion

Cómo consume este frontend el microservicio de chat en tiempo real. Contrato completo:
[`../../chat-conversacion/docs/contratos-api.md`](../../chat-conversacion/docs/contratos-api.md).

## Configuración

| Variable | Por defecto | Notas |
|----------|-------------|-------|
| `NEXT_PUBLIC_CONVERSACION_BASE_URL` | `http://localhost:8082` | Base URL de `chat-conversacion`. WebSocket y REST comparten host/puerto (contrato §1); el esquema `ws`/`wss` se deriva del de esta variable, no hay una segunda. Se **inyecta en tiempo de build** (export estático). Define en `.env.local` para desarrollo. |

CORS (REST) y orígenes permitidos (WebSocket) son configuración del propio
`chat-conversacion` (`CORS_ALLOWED_ORIGINS` / `WEBSOCKET_ALLOWED_ORIGINS`, dos
variables **distintas** — ver su contrato §1); ambas traen por defecto
`http://localhost:3000`, que ya coincide con `npm run dev`.

## Dónde vive el código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/conversacion/config.js` | `CONVERSACION_BASE_URL` + `urlSocketConversacion(usuario)`. |
| `src/conversacion/historial.js` | `obtenerHistorial(usuarioA, usuarioB, opciones)` → `GET /api/v1/conversaciones/{a}/{b}`, resultado tipado igual que `src/api/registro.js`. |
| `src/utils/validacionConversacion.js` | Formato de username (espejo del de chat-registro) y de `contenido` (no vacío, ≤ 2000) — espejo del contrato, la autoritativa sigue siendo el servidor. |
| `src/hooks/useConversacion.js` | El hook central: carga el historial, abre el WebSocket de `{yo}`, filtra los mensajes de esta conversación, expone `enviarMensaje`. |
| `src/utils/miUsuario.js` | Recuerda el `username` en `localStorage` — ver "Identidad" más abajo. |
| `src/components/atoms/BurbujaMensaje/` | Una burbuja de mensaje (propio/ajeno). |
| `src/components/molecules/CampoMensaje/` | Campo de texto + botón de envío. |
| `src/components/organisms/Conversacion/` | Lista de mensajes (auto-scroll) + `CampoMensaje`. |
| `src/components/pages/HomePage/` | En `/home`, el destino tras iniciar sesión. Formulario de identidad (una vez) → `Conversacion` conectada de verdad. Exige sesión (`useRequiereSesion`). |

## Identidad: por qué hay que escribir "tu usuario" a mano

`chat-conversacion` identifica cada lado de la conversación por el
**`username` de chat-registro** (contrato §2.1) — no por `uid` ni `email` de
Firebase. El login de este frontend es con Firebase (`src/firebase/auth.js`)
y no expone ese username en ningún sitio: **chat-registro no tiene un
endpoint para resolverlo** a partir del `uid`/email de la sesión (su único
endpoint es `POST /api/v1/registro`, ver
`chat-registro/docs/contratos-api.md`).

Mientras eso no exista, `HomePage` lo pide una vez con un formulario simple
y lo recuerda en `localStorage` (`src/utils/miUsuario.js`) — `RegistroPage`
también lo guarda solo, si te registraste en este navegador
(`guardarMiUsuario(datos.username)` tras un alta correcta). Con quién
chatear (`con`) **no** se recuerda — no hay lista de contactos todavía, es
solo esta vista de una conversación.

Cuando chat-registro exponga una forma de resolver el username desde la
sesión (o `chat-gateway` lo orqueste), este formulario deja de hacer falta
para "tu usuario" — el de "con quién chatear" seguirá siendo necesario hasta
que exista una lista de contactos/conversaciones.

## Cómo funciona `useConversacion`

```jsx
const { mensajes, cargandoHistorial, errorHistorial, conectado, enviarMensaje } =
  useConversacion({ yo, con });
```

1. **Historial** (`GET /api/v1/conversaciones/{yo}/{con}`, contrato §3): se
   pide con `sort=enviadoEn,desc` (lo más reciente primero, como recomienda
   el contrato §5.7) y se invierte en el cliente para pintar en orden
   cronológico.
2. **WebSocket** (`/ws/chat/{yo}`, contrato §2.1): se abre una sola vez por
   `yo` — cambiar de `con` (interlocutor) **no** reabre la conexión, solo
   cambia a qué mensajes hace caso (vía un `ref`, no en las dependencias del
   efecto, para no perder mensajes que lleguen justo al cambiar).
3. **Filtro de terceros**: el socket de `{yo}` recibe *todo* lo dirigido a
   `{yo}` (contrato §2.1), no solo lo de esta conversación — un mensaje que
   no sea entre `yo` y `con` se descarta antes de añadirse a `mensajes`.
4. **`enviarMensaje(contenido)`** valida `contenido` en cliente (contrato
   §5.2: el WebSocket **descarta en silencio** un mensaje inválido, sin
   frame de rechazo — validar antes de mandar no es opcional) y manda el
   frame; nunca lo añade a `mensajes` de forma optimista — el mensaje que
   vuelve por el socket (contrato §5.3) es la única confirmación, tanto para
   quien lo manda como para quien lo recibe.
5. **Deduplicación por `id`**: por si el mismo mensaje llegara dos veces
   (reconexión del socket, etc.).

`Conversacion` (el organismo) deshabilita `CampoMensaje` mientras
`conectado` es `false`, para no dejar escribir algo que el servidor
descartaría en silencio.

## Verificado en caliente

Con `chat-conversacion` corriendo en local (`./gradlew bootRun`, MongoDB en
`localhost:27017`) y `chat-frontend` en `npm run dev`: login → `/home` →
identidad → historial cargado (`200` con CORS) → "Conectado" → mensaje
escrito en la UI, recibido de vuelta por el socket con `id`/`enviadoEn`
reales, persistido (sigue ahí tras recargar la página).
