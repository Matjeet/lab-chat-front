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
| `src/conversacion/listaChats.js` | `obtenerListaChats(usuario, idToken, opciones)` → `GET /api/v1/conversaciones/{usuario}/chats` (contrato §4.5, autenticado, paginado por cursor) — resumen de cada chat con el último mensaje. |
| `src/hooks/useListaChats.js` | `{chats, cargando, cargandoMas, error, hasMore, cargarMas, registrarMensajeNuevo}` — pide la lista en cuanto hay `yo` y sesión, pagina por cursor (scroll infinito) y permite actualizarla al vuelo sin refrescar, tanto para un mensaje enviado como recibido. Ver "La lista de chats" más abajo. |
| `src/components/atoms/ItemChat/` | Un elemento de la lista: el otro usuario (fuente grande) + su último mensaje (fuente pequeña, color apagado, recortado con `…`). |
| `src/components/organisms/ListaChats/` | La lista completa, a la izquierda de `/home` — estados de carga/error/vacío + el scroll infinito (`IntersectionObserver` sobre un centinela al final). |
| `src/utils/validacionConversacion.js` | Formato de username (espejo del de chat-registro) y de `contenido` (no vacío, ≤ 2000) — espejo del contrato, la autoritativa sigue siendo el servidor. |
| `src/hooks/useCanalMensajes.js` | Único punto que abre el WebSocket de `{yo}` (`/ws/chat/{yo}`) — un solo socket para toda la app, llamado una vez en `HomePage`, no uno por conversación. Expone `{conectado, ultimoMensaje, enviarMensaje}`; `ultimoMensaje` no filtra por interlocutor, cada consumidor decide qué hacer con él. Ver "El canal de mensajes en tiempo real" más abajo. |
| `src/hooks/useConversacion.js` | Carga el historial de una conversación y observa `useCanalMensajes` (recibido como prop `canal`) para quedarse solo con los mensajes de `con`; expone `enviarMensaje`. Ya no abre ningún socket propio. |
| `src/api/usuario.js` | `obtenerUsuario(uid, idToken)` → `GET /api/v1/usuarios/{uid}` (contrato §4.2, autenticado) — resultado tipado. |
| `src/hooks/useMiUsuario.js` | `{yo, establecerYo}` — resuelve "tu usuario": `localStorage` de inmediato, y lo sincroniza con `obtenerUsuario` en cuanto hay sesión. Ver "Identidad" más abajo. |
| `src/utils/miUsuario.js` | `localStorage` puro (leer/guardar `yo`) que usa `useMiUsuario` por debajo, y que `RegistroPage` sigue usando directamente tras un alta. |
| `src/context/InterlocutorContext.jsx` | `{con, establecerCon}` — con quién se está chateando ahora. Lo escriben `ListaChats` y `Notificaciones` (al aceptar una solicitud) — `SelectorInterlocutor` ya no, ver "Identidad" —, lo lee `HomePage`. No persiste. |
| `src/hooks/useExisteUsuario.js` | Función `(username) => Promise<ResultadoExisteUsuario>` — comprueba si un username existe, con el `idToken` de cualquier sesión activa. Ver "Identidad" más abajo. |
| `src/conversacion/solicitudes.js` | `crearSolicitud(solicitante, solicitado, idToken)` → `POST /api/v1/conversaciones/solicitudes` (contrato §4.7, autenticado) — crea una solicitud de chat, resultado tipado. |
| `src/hooks/useCrearSolicitudChat.js` | Función `(solicitante, solicitado) => Promise<ResultadoCrearSolicitud>` — mismo patrón que `useExisteUsuario`: resuelve el `idToken` de la sesión activa por debajo. |
| `src/components/molecules/SelectorInterlocutor/` | Desde la cabecera (`headerCentro` de `DefaultLayout`), **manda una solicitud de chat** hacia un usuario nuevo — valida el formato y que exista de verdad antes de mandarla. Ya no abre la conversación directamente. |
| `src/components/atoms/BurbujaMensaje/` | Una burbuja de mensaje (propio/ajeno). |
| `src/components/molecules/CampoMensaje/` | Campo de texto + botón de envío. |
| `src/components/organisms/Conversacion/` | Lista de mensajes (auto-scroll) + `CampoMensaje`. |
| `src/components/pages/HomePage/` | En `/home`, el destino tras iniciar sesión. `yo` sale de `useMiUsuario`; `con` llega de `InterlocutorContext` (por la cabecera o por `ListaChats`). Dos columnas: `ListaChats` a la izquierda, `Conversacion` (o un aviso) a la derecha. Exige sesión (`useRequiereSesion`). |

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
- **Con quién chatear (`con`)**: dos formas de confirmarlo en
  `InterlocutorContext#establecerCon` hoy — un click en un chat ya existente
  en `ListaChats`, a la izquierda de `/home`; o aceptar una solicitud de chat
  entrante desde la campana de notificaciones (`Notificaciones`, ver
  `docs/integracion-notificaciones.md`) — este segundo es justo el uso que
  se preveía para este mecanismo cuando `SelectorInterlocutor` dejó de
  dispararlo directamente. `con` vive en `InterlocutorContext` y **no
  persiste** (ni `localStorage` ni entre recargas): es solo la conversación
  activa de esta sesión de navegación — quien quiera la lista de con quién
  ya se ha hablado tiene `ListaChats`, que sí persiste (la sirve el
  backend). Cambiarlo, estando ya en `/home`, cambia la conversación abierta
  al instante.

  **`SelectorInterlocutor` (la cabecera) ya no abre un chat nuevo
  directamente — manda una solicitud.** Empezar a chatear con alguien con
  quien `yo` no tenía conversación todavía pasa ahora por
  `POST /api/v1/conversaciones/solicitudes` (contrato §4.7): una solicitud
  que el otro usuario debe aceptar o rechazar — ver
  `docs/integracion-notificaciones.md` para ese lado del flujo
  (`PATCH /api/v1/conversaciones/solicitudes`, contrato §4.10, disparado
  desde la campana de notificaciones, no desde aquí). Al enviar el
  formulario (click en "Ir", o Enter), tres pasos:
  1. Formato (`validarUsername`) — error de campo si falla, no llega a pedir nada.
  2. **Que el username exista de verdad** — `useExisteUsuario` llama a
     `GET /api/v1/usuarios/existe` (`src/api/usuario.js#existeUsuario`,
     chat-gateway contrato §4.6) — para no mandar una solicitud hacia
     alguien que no está en la aplicación. A diferencia de
     `obtenerUsuario`/`obtenerListaChats`, este endpoint no compara
     identidad: cualquier sesión de Firebase activa sirve para preguntar por
     *cualquier* username.
  3. **Crear la solicitud** — `useCrearSolicitudChat`, con `yo` (recibido por
     prop, quien monta `SelectorInterlocutor` ya lo resolvió) como
     `solicitante`. Si se crea, un `Modal` `tono="info"` (azul, con el
     usuario y "acepte" en negrilla) confirma el envío y aclara que el chat
     empieza cuando el otro usuario la acepte — la conversación **no** se
     abre en ese momento, ni se toca `InterlocutorContext`. Ese modal, además
     de sus formas normales de cerrarse (botón, Escape, clic en el fondo),
     también se cierra solo a los 5 segundos.

  Mientras cualquiera de las dos llamadas está en vuelo, el campo y el botón
  se deshabilitan (evita un doble envío). Mensajes, según su forma (ver
  `docs/sistema-de-diseno.md` → "Modal"): de campo — formato inválido, o un
  `kind: 'validacion'` del backend (incluye pedirte una solicitud a ti
  mismo); bloqueantes con `Modal` `tono="error"` (rojo, algo salió mal de
  verdad) — el usuario no existe, alguna comprobación falla (red, servidor,
  sesión); bloqueantes con `Modal` `tono="info"` (azul, no es un error) — ya
  hay una solicitud **pendiente** entre ambos (`kind: 'duplicada'`, 409) o
  la solicitud se envió. La respuesta trae un campo `pendiente`
  (`SolicitudChat`, `src/conversacion/solicitudes.js`), `true` mientras nadie
  la haya aceptado o rechazado (`actualizarSolicitud`, en el mismo módulo,
  usada desde la campana de notificaciones — ver
  `docs/integracion-notificaciones.md`) — una solicitud ya resuelta no
  bloquea una nueva.

`HomePage` decide qué mostrar según `yo`/`con`: sin `yo` resuelto (ni por
`localStorage` ni por el backend), pide el formulario manual; con `yo` pero
sin `con`, invita a elegir un chat de la lista o escribir uno nuevo en la
cabecera; si `yo === con` (comparación insensible a mayúsculas), avisa que
no puedes chatear contigo mismo; con los dos válidos y distintos, monta la
conversación.

## La lista de chats

```jsx
const { chats, cargando, cargandoMas, error, hasMore, cargarMas, registrarMensajeNuevo } =
  useListaChats(yo);
```

- **Carga inicial**: en cuanto `yo` no está vacío y hay sesión de Firebase
  activa (mismo criterio que `useMiUsuario`: nunca llama al backend sin
  ambas cosas), pide la primera página de `GET
  /api/v1/conversaciones/{yo}/chats` (contrato §4.5).
- **Scroll infinito**: `ListaChats` observa un centinela al final de la
  lista con `IntersectionObserver`; al hacerse visible, si `hasMore` es
  `true`, llama a `cargarMas()`, que pide la siguiente página con el
  `nextCursor` de la anterior (opaco, se manda tal cual) y la añade al
  final.
- **Un chat nuevo no aparece por elegirlo en la cabecera.** Para
  chat-conversacion, un chat no existe hasta que hay al menos un mensaje
  real (agrupa por mensajes, no hay una entidad "conversación" aparte) —
  así que la lista tampoco debe inventárselo antes. `HomePage` observa
  directamente `canal.ultimoMensaje` (el canal centralizado de
  `useCanalMensajes`, ver más abajo) y, con cada mensaje nuevo —
  **enviado o recibido, sin importar si esa conversación está abierta**—,
  calcula el otro usuario (`remitente` si `yo` es el `destinatario`,
  `destinatario` si `yo` es el `remitente`) y llama a
  `registrarMensajeNuevo(otroUsuario, mensaje)`: mueve (o crea) esa entrada
  a la primera posición de `chats`, con ese mensaje como el último — sin
  esperar a un refresco completo de la lista. Antes, esto solo pasaba para
  un mensaje enviado por `yo`, y solo con la conversación abierta (ver
  `especificacion-canal-mensajes-tiempo-real.md`) — un chat nuevo iniciado
  por la otra persona no aparecía hasta recargar la página.

## El canal de mensajes en tiempo real (`useCanalMensajes`)

```jsx
const { conectado, ultimoMensaje, enviarMensaje } = useCanalMensajes(yo);
```

Único punto del frontend que abre el WebSocket de `{yo}` a chat-gateway
(`/ws/chat/{yo}`, contrato §2.1) — `HomePage` lo llama **una sola vez**, en
cuanto conoce `yo`, y reparte el resultado (`canal`) a quien lo necesite:
`VistaConversacion` → `useConversacion` (para pintar la conversación
abierta) y el propio `HomePage` (para `ListaChats`, ver arriba). Antes,
esta conexión vivía dentro de `useConversacion`, que solo se monta con una
conversación abierta — un mensaje de un chat sin abrir (o sin ningún chat
seleccionado) no llegaba a ningún sitio.

1. **Conecta solo con `yo` no vacío** — sin sesión resuelta todavía,
   `conectado` es `false` y no hay socket.
2. **Un solo socket por `yo`**: cambiar de conversación (`con`, en quien lo
   consume) no lo reabre — eso ya no depende de este hook, que ni siquiera
   conoce `con`.
3. **Reconexión automática**: si el socket se cierra —cayó, chat-gateway
   reinició, o ni siquiera llegó a abrirse porque el backend estaba caído en
   ese momento—, se reintenta solo pasados 3 segundos
   (`RETRASO_REINTENTO_SOCKET_MS`), sin límite de intentos y sin acción del
   usuario — el contrato lo pide explícitamente
   (`chat-gateway/docs/contratos-api.md` §4.3: "el cliente debe tratar eso
   como una desconexión y reintentar").
4. **Sin filtrar por conversación**: cada mensaje válido que llega se expone
   tal cual en `ultimoMensaje` — siempre un objeto nuevo, nunca la misma
   referencia entre dos mensajes distintos, para que un `useEffect` con
   `[ultimoMensaje]` como dependencia dispare en cada uno. Decidir qué hacer
   con él es cosa de quien consuma el hook.
5. **`enviarMensaje(destinatario, contenido)`** valida `contenido` en
   cliente (contrato §5.2: ni el gateway ni chat-conversacion devuelven un
   *frame* de rechazo por un mensaje inválido, lo descartan en silencio —
   validar antes de mandar no es opcional) y manda el frame.

## Cómo funciona `useConversacion`

```jsx
const {
  mensajes,
  cargandoHistorial,
  errorHistorial,
  reintentarHistorial,
  conectado,
  enviarMensaje,
} = useConversacion({ yo, con, canal });
```

`canal` es lo que devuelve `useCanalMensajes` (ver arriba) — `HomePage` lo
abre una sola vez y se lo pasa a `VistaConversacion`, que a su vez se lo
pasa a este hook.

1. **Historial** (`GET /api/v1/conversaciones/{yo}/{con}` contra chat-gateway,
   contrato §3): se pide con `sort=enviadoEn,desc` (lo más reciente primero,
   como recomienda el contrato de chat-conversacion §5.7) y se invierte en el
   cliente para pintar en orden cronológico. Si falla, `reintentarHistorial()`
   lo vuelve a pedir con el mismo `yo`/`con` (un contador interno,
   `intentoHistorial`, entra en las dependencias del efecto solo para poder
   repetirlo a voluntad) — `VistaConversacion` (`HomePage`) lo cuelga de un
   botón "Reintentar" en el aviso de error. Sin cambios respecto a antes.
2. **Mensajes en tiempo real, vía `canal`**: un `useEffect` con
   `canal.ultimoMensaje` como dependencia filtra si ese mensaje es de esta
   conversación (`con`) — mismo criterio que antes, solo que ahora sobre el
   mensaje que expone el canal compartido en vez del `onmessage` de un
   socket propio: el socket de `{yo}` recibe *todo* lo dirigido a `{yo}`
   (contrato §2.3), no solo lo de esta conversación, así que un mensaje que
   no sea entre `yo` y `con` se descarta antes de añadirse a `mensajes`.
3. **`conectado`** es directamente `canal.conectado` — ya no hay estado
   propio para esto.
4. **`enviarMensaje(contenido)`** es un envoltorio delgado sobre
   `canal.enviarMensaje(con, contenido)` — la validación de `contenido` vive
   en `useCanalMensajes`, no se duplica aquí. Nunca añade nada a `mensajes`
   de forma optimista — el mensaje que vuelve por el canal (contrato §5.3)
   es la única confirmación, tanto para quien lo manda como para quien lo
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
identidad → historial cargado (`200` con CORS) → socket abierto → mensaje
escrito en la UI, recibido de vuelta por el socket con `id`/`enviadoEn`
reales, persistido (sigue ahí tras recargar la página) — todo pasando por
`chat-gateway`, nunca directo contra el `8082` de `chat-conversacion`.

**El canal centralizado (`useCanalMensajes`) no se re-verificó en caliente**
tras introducirlo — el cambio está cubierto por la suite de hooks/integración
(`useCanalMensajes.test.js`, `useConversacion.test.js`,
`HomePage.test.jsx`, incluido el caso de un mensaje de un chat sin abrir
apareciendo en `ListaChats`), pero no hay una sesión real contra los tres
backends confirmando el caso de punta a punta descrito en
`especificacion-canal-mensajes-tiempo-real.md`.
