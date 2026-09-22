# Integración con el chat en tiempo real (vía chat-gateway)

Cómo consume este frontend el chat 1 a 1. El cliente habla siempre con
**chat-gateway** — nunca directo con `chat-conversacion` — que por debajo
abre un stream gRPC hacia ese servicio y traduce cada frame. Contrato
completo:
[`../../chat-gateway/docs/contratos-api.md`](../../chat-gateway/docs/contratos-api.md) §4.3 y §4.4
(y, para el detalle de lo que hay detrás del gateway,
[`../../chat-conversacion/docs/contratos-api.md`](../../chat-conversacion/docs/contratos-api.md)).

## Configuración

No hay una variable propia: WebSocket y REST del chat comparten el mismo
origen que el resto de la API, `NEXT_PUBLIC_API_BASE_URL` (`src/api/config.js`,
ver [`integracion-api.md`](./integracion-api.md)) — chat-gateway es el único
punto de entrada del sistema, así que un solo origen basta para registro,
historial y WebSocket.

CORS (REST) y orígenes permitidos (WebSocket) son configuración del propio
`chat-gateway` (`CORS_ALLOWED_ORIGINS` / `WEBSOCKET_ALLOWED_ORIGINS`, dos
variables **distintas** — el handshake de WebSocket no pasa por CORS, ver
contrato §1); ambas traen por defecto `http://localhost:3000`, que ya
coincide con `npm run dev`.

## Dónde vive el código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/conversacion/config.js` | `urlSocketConversacion(usuario)`, sobre `API_BASE_URL` (`src/api/config.js`). |
| `src/conversacion/historial.js` | `obtenerHistorial(usuarioA, usuarioB, opciones)` → `GET /api/v1/conversaciones/{a}/{b}` (contra chat-gateway), resultado tipado igual que `src/api/registro.js`. |
| `src/conversacion/listaChats.js` | `obtenerListaChats(usuario, idToken, opciones)` → `GET /api/v1/conversaciones/{usuario}/chats` (contrato §4.5, autenticado, paginado por cursor) — resumen de cada chat con el último mensaje. Todavía sin UI propia (pantalla de "conversaciones" pendiente). |
| `src/utils/validacionConversacion.js` | Formato de username (espejo del de chat-registro) y de `contenido` (no vacío, ≤ 2000) — espejo del contrato, la autoritativa sigue siendo el servidor. |
| `src/hooks/useConversacion.js` | El hook central: carga el historial, abre el WebSocket de `{yo}`, filtra los mensajes de esta conversación, expone `enviarMensaje`. |
| `src/api/usuario.js` | `obtenerUsuario(uid, idToken)` → `GET /api/v1/usuarios/{uid}` (contrato §4.2, autenticado) — resultado tipado. |
| `src/hooks/useMiUsuario.js` | `{yo, establecerYo}` — resuelve "tu usuario": `localStorage` de inmediato, y lo sincroniza con `obtenerUsuario` en cuanto hay sesión. Ver "Identidad" más abajo. |
| `src/utils/miUsuario.js` | `localStorage` puro (leer/guardar `yo`) que usa `useMiUsuario` por debajo, y que `RegistroPage` sigue usando directamente tras un alta. |
| `src/context/InterlocutorContext.jsx` | `{con, establecerCon}` — con quién se está chateando ahora. Lo escribe `SelectorInterlocutor`, lo lee `HomePage`. No persiste (ver "Identidad"). |
| `src/components/molecules/SelectorInterlocutor/` | Elige `con` desde la cabecera (`headerCentro` de `DefaultLayout`) — valida el formato antes de confirmar. |
| `src/components/atoms/BurbujaMensaje/` | Una burbuja de mensaje (propio/ajeno). |
| `src/components/molecules/CampoMensaje/` | Campo de texto + botón de envío. |
| `src/components/organisms/Conversacion/` | Lista de mensajes (auto-scroll) + `CampoMensaje`. |
| `src/components/pages/HomePage/` | En `/home`, el destino tras iniciar sesión. `yo` sale de `useMiUsuario`; `con` llega de `InterlocutorContext`. Con ambos, `Conversacion` conectada de verdad. Exige sesión (`useRequiereSesion`). |

## Identidad

El chat identifica cada lado de la conversación por el **`username` de
chat-registro** (chat-gateway valida su formato en el propio *handshake* del
WebSocket, contrato §2.1) — no por `uid` ni `email` de Firebase. Dos campos
separados, con dos ciclos de vida distintos:

- **Tu usuario (`yo`)**: lo resuelve `useMiUsuario`
  (`src/hooks/useMiUsuario.js`), en dos pasos:
  1. Al montarse, lee lo que ya hubiera en `localStorage`
     (`src/utils/miUsuario.js`) — un alta anterior en este navegador
     (`RegistroPage` ya lo guarda solo,
     `guardarMiUsuario(datos.username)`), o una sincronización previa.
  2. En cuanto `observarSesion` entrega una sesión de Firebase — justo tras
     iniciarla, o al abrir la pantalla ya autenticado en otra
     pestaña/navegador —, llama a `GET /api/v1/usuarios/{uid}`
     (`src/api/usuario.js`, chat-gateway, contrato §4.2) con el `idToken` de
     esa sesión y, si resuelve, sustituye lo que hubiera y lo guarda en
     `localStorage`. **Nunca se llama sin sesión** — es el único endpoint
     autenticado del sistema.

     Si el backend no resuelve (servicio caído, o una cuenta de Firebase sin
     perfil de chat-registro todavía), `HomePage` cae a un formulario manual
     como respaldo — `establecerYo` guarda esa confirmación igual que la
     sincronización automática.
- **Con quién chatear (`con`)**: se elige con `SelectorInterlocutor`, **en la
  cabecera** — visible en toda pantalla que exige sesión (`HomePage`,
  `StyleGuidePage`), nunca en `/login` ni `/registro`. Vive en
  `InterlocutorContext` y **no persiste** (ni `localStorage` ni entre
  recargas): no hay lista de contactos todavía, es solo la conversación
  activa de esta sesión de navegación. Cambiarlo desde la cabecera, estando
  ya en `/home`, cambia la conversación abierta al instante.

`HomePage` decide qué mostrar según ambos: sin `yo` resuelto (ni por
`localStorage` ni por el backend), pide el formulario manual; con `yo` pero
sin `con`, invita a elegir interlocutor en la cabecera; si `yo === con`
(comparación insensible a mayúsculas), avisa que no puedes chatear contigo
mismo; con los dos válidos y distintos, monta la conversación.

El selector de "con quién chatear" seguirá siendo manual hasta que exista
una lista de contactos/conversaciones — no hay (ni tiene sentido que haya)
un endpoint que la adivine.

## Cómo funciona `useConversacion`

```jsx
const { mensajes, cargandoHistorial, errorHistorial, conectado, enviarMensaje } =
  useConversacion({ yo, con });
```

1. **Historial** (`GET /api/v1/conversaciones/{yo}/{con}` contra chat-gateway,
   contrato §3): se pide con `sort=enviadoEn,desc` (lo más reciente primero,
   como recomienda el contrato de chat-conversacion §5.7) y se invierte en el
   cliente para pintar en orden cronológico.
2. **WebSocket** (`/ws/chat/{yo}` contra chat-gateway, contrato §2.1): se abre
   una sola vez por `yo` — cambiar de `con` (interlocutor) **no** reabre la
   conexión, solo cambia a qué mensajes hace caso (vía un `ref`, no en las
   dependencias del efecto, para no perder mensajes que lleguen justo al
   cambiar).
3. **Filtro de terceros**: el socket de `{yo}` recibe *todo* lo dirigido a
   `{yo}` (contrato §2.3) — incluida la entrega que llegue por un cliente
   conectado directo a chat-conversacion en vez de por el gateway, ver §2.3 —,
   no solo lo de esta conversación: un mensaje que no sea entre `yo` y `con`
   se descarta antes de añadirse a `mensajes`.
4. **`enviarMensaje(contenido)`** valida `contenido` en cliente (contrato
   §5.2: ni el gateway ni chat-conversacion devuelven un *frame* de rechazo
   por un mensaje inválido, lo descartan en silencio — validar antes de
   mandar no es opcional) y manda el frame; nunca lo añade a `mensajes` de
   forma optimista — el mensaje que vuelve por el socket (contrato §5.3) es
   la única confirmación, tanto para quien lo manda como para quien lo
   recibe.
5. **Deduplicación por `id`**: por si el mismo mensaje llegara dos veces
   (reconexión del socket, etc.).

`Conversacion` (el organismo) deshabilita `CampoMensaje` mientras
`conectado` es `false`, para no dejar escribir algo que el servidor
descartaría en silencio.

## Verificado en caliente

Con `chat-conversacion` y `chat-gateway` corriendo en local (`./gradlew
bootRun` en ambos, MongoDB en `localhost:27017`) y `chat-frontend` en `npm run
dev`, apuntando al gateway (`http://localhost:8080`): login → `/home` →
identidad → historial cargado (`200` con CORS) → "Conectado" → mensaje
escrito en la UI, recibido de vuelta por el socket con `id`/`enviadoEn`
reales, persistido (sigue ahí tras recargar la página) — todo pasando por
`chat-gateway`, nunca directo contra el `8082` de `chat-conversacion`.
