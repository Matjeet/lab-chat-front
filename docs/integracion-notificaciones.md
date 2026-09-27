# Integración con las notificaciones (vía chat-gateway)

Cómo consume este frontend la bandeja de notificaciones. El cliente habla
siempre con **chat-gateway** — nunca directo con `chat-notificaciones` ni
`chat-conversacion`. Contrato completo:
[`../../chat-gateway/docs/contratos-api.md`](../../chat-gateway/docs/contratos-api.md)
§4.8 y §4.9 (leer/marcar notificaciones) y §4.10 (aceptar/rechazar una
solicitud — ver `docs/integracion-conversacion.md` para el resto del ciclo
de vida de una solicitud).

## Configuración

Mismo origen que el resto de la API, `NEXT_PUBLIC_API_BASE_URL`
(`src/api/config.js`) — no hay variables propias.

## Dónde vive el código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/notificaciones/notificaciones.js` | `obtenerNotificaciones(receptor, idToken, opciones)` → `GET /api/v1/notificaciones/{receptor}` (contrato §4.8, paginado por página/offset, no por cursor) y `actualizarLeida(id, uid, leida, idToken)` → `PATCH /api/v1/notificaciones/{id}` (contrato §4.9) — ambos con resultado tipado, igual que el resto de `src/api/` y `src/conversacion/`. También parsea `meta` (JSON crudo → objeto) una sola vez, para que el resto de la app nunca toque texto JSON — ver más abajo. |
| `src/hooks/useNotificaciones.js` | `{notificaciones, cargando, error, noLeidas, recargar, marcarLeida, marcarNoLeida}` — pide la bandeja en cuanto hay `receptor` y sesión, resuelve `idToken` **y** `uid` de Firebase (`actualizarLeida` compara por uid directo, no por username — ver "Quién verifica qué" abajo). |
| `src/components/atoms/ItemNotificacion/` | Un elemento del panel: arma el texto a partir de `tipo` (el backend no manda uno redactado — hoy solo existe `"solicitud"`), decide entre botones de aceptar/rechazar o un texto de estado según `meta.pendiente`/`meta.aceptada` (ver más abajo), y muestra el botón de marcar como no leída si ya está leída. |
| `src/components/organisms/Notificaciones/` | La campana de la cabecera + el panel desplegable — scroll propio, insignia con `noLeidas`, orquesta las acciones de `ItemNotificacion` contra `useNotificaciones` y `useActualizarSolicitud`. |
| `src/conversacion/solicitudes.js` (`actualizarSolicitud`) | `PATCH /api/v1/conversaciones/solicitudes` (contrato §4.10 de chat-gateway) — acepta o rechaza una solicitud pendiente. Vive en `src/conversacion/`, no en `src/notificaciones/`, porque es un endpoint de `/api/v1/conversaciones/**`, aunque quien lo dispara sea el panel de notificaciones. |
| `src/hooks/useActualizarSolicitud.js` | Mismo patrón que `useCrearSolicitudChat`: solo resuelve `idToken`, expone `(solicitante, solicitado, aceptada) => Promise<Resultado>`. |

## Quién verifica qué (heredado del contrato, importa para no romper supuestos)

- **`GET /api/v1/notificaciones/{receptor}`** compara identidad por
  **username resuelto** — igual mecanismo que la lista de chats
  (`GET /api/v1/conversaciones/{usuario}/chats`): el gateway resuelve el
  `username` del uid autenticado contra `chat-registro` y lo compara contra
  `{receptor}`. Por eso `useNotificaciones` recibe `receptor` como el `yo`
  ya resuelto (`useMiUsuario`), no como un dato propio.
- **`PATCH /api/v1/notificaciones/{id}`** compara por **uid directo** — igual
  mecanismo que `GET /api/v1/usuarios/{uid}` —, sin resolver nada contra
  `chat-registro`. Por eso `useNotificaciones` guarda también el `uid` crudo
  de Firebase (`observarSesion`), no solo el `idToken`: `actualizarLeida`
  necesita mandarlo en el cuerpo (`{ uid, leida }`).
- **Limitación conocida, heredada de `chat-notificaciones`:** ese `uid` prueba
  que quien llama es quien dice ser, pero no que sea el receptor real de esa
  notificación concreta — `chat-notificaciones` todavía no vincula una
  notificación a un uid ni a un username. No es un bug de este frontend.

## El conteo de "no leídas" es aproximado

El backend no expone un endpoint de "cuántas notificaciones sin leer tiene
este usuario en total" — solo la lista paginada. `useNotificaciones` pide una
sola página (`TAMANO_PAGINA` = 20, las más recientes) y calcula `noLeidas`
contando `!leida` dentro de esa página. Si hay notificaciones sin leer más
atrás de esa página, no se cuentan. Aceptable para la insignia de la campana
(un vistazo, no un contador crítico); si en algún momento se necesita exacto,
hace falta un endpoint dedicado en `chat-notificaciones`.

La insignia (`Notificaciones`) muestra el número tal cual hasta 9; más de 9
se ve como "9+" (`INSIGNIA_MAXIMA`).

## El panel

- Se abre al pulsar la campana; **recarga la lista cada vez que se abre**
  (`recargar`, del hook) para no mostrar datos viejos si algo llegó mientras
  estaba cerrado.
- Se cierra con un clic fuera, con Escape, o volviendo a pulsar la campana —
  mismo criterio que cualquier desplegable de la cabecera (no es un `Modal`:
  no bloquea el resto de la pantalla).
- El cuerpo (`.panelCuerpo`) tiene una altura máxima con scroll propio, para
  no crecer indefinidamente con muchas notificaciones.
- **"Leída" se marca al pasar el mouse** por encima de una notificación sin
  leer (`ItemNotificacion#onMouseEnter`) — optimista: el estado local cambia
  de inmediato, la llamada a `PATCH` va en segundo plano sin bloquear la UI
  (es un cambio de bajo riesgo, no necesita reconciliación fina si falla).
  Una notificación ya leída muestra un botón de icono para devolverla a "no
  leída" (`marcarNoLeida`).

## Solicitudes de chat entrantes — `meta` y sus tres estados

Una notificación de `tipo: "solicitud"` trae `meta` — información propia del
tipo, que el gateway solo propaga como texto JSON crudo sin interpretarlo
(contrato §4.8/§4.9): `{"aceptada": boolean, "pendiente": boolean}`.
`src/notificaciones/notificaciones.js` la parsea una sola vez (`conMetaParseada`)
así que, para el resto de la app, `notificacion.meta` ya es un objeto (o
`null` si no la trae, o si el JSON no se pudo parsear — mismo tratamiento que
"sin meta": no hay nada que el usuario pueda hacer con un JSON corrupto).

`ItemNotificacion` decide qué mostrar en la zona de acciones según ese objeto
(`meta?.pendiente ?? true` — sin `meta`, se asume pendiente, el
comportamiento de antes de que este campo existiera):

| `meta.pendiente` | `meta.aceptada` | Qué se muestra |
|---|---|---|
| `true` (o sin `meta`) | — | Botones de aceptar (verde, `variant="success"` de `Button`) y rechazar (rojo, `variant="danger"`) |
| `false` | `true` | Texto verde **"Aceptada"**, de solo lectura |
| `false` | `false` | Texto rojo **"Rechazada"**, de solo lectura |

Los botones llaman a `useActualizarSolicitud` (`PATCH
/api/v1/conversaciones/solicitudes`, contrato §4.10): `solicitante` es
`notificacion.remitente` (quien la envió), `solicitado` es `yo` (quien la
recibió — **debe ser el dueño del `idToken`**, el gateway compara contra
`solicitado`, al revés que crear una solicitud, que compara contra
`solicitante`), `aceptada` es `true`/`false` según el botón. La respuesta
trae la `SolicitudChat` actualizada (`pendiente: false`,
`aceptada` reflejando lo pedido) — no hace falta releerla ni actualizar
`meta` a mano: la próxima vez que se abra el panel (`recargar`), la
notificación ya viene con el `meta` nuevo desde `chat-notificaciones`.

- **Aceptar** (`alAceptar` en `Notificaciones`): abre la conversación de
  inmediato con quien envió la solicitud
  (`InterlocutorContext#establecerCon`, el mismo mecanismo que ya usa
  `ListaChats` al elegir un chat existente) **en paralelo** con la llamada a
  `actualizarSolicitud` — no espera su respuesta, son dos acciones
  independientes, no una cadena. También marca la notificación como leída y
  cierra el panel, los tres de inmediato. Si la llamada al backend falla en
  segundo plano, un `Modal` `tono="error"` avisa — el chat ya abierto no se
  deshace, solo se informa de que la confirmación en el servidor no llegó.
- **Rechazar** (`alRechazar`): espera la respuesta antes de hacer nada más
  (no hay ningún chat que abrir). Si sale bien, marca la notificación como
  leída, muestra un `Modal` `tono="info"` confirmando "La solicitud fue
  rechazada exitosamente." y, medio segundo después
  (`RETRASO_RECARGA_RECHAZO_MS`), vuelve a llamar a `recargar` — solo en
  este caso — para refrescar la lista con el `meta` ya resuelto sin esperar
  a que el panel se cierre y se abra de nuevo; el retraso le da margen a la
  cadena chat-conversacion → RabbitMQ → chat-notificaciones para propagar el
  cambio antes de volver a pedir la página. Si falla, un `Modal`
  `tono="error"` — con un mensaje específico si la causa es
  `kind: 'no-encontrado'` (la solicitud ya no existe o ya se resolvió antes,
  p. ej. por el otro usuario, o en otra pestaña) — y no se recarga nada.

Mientras cualquiera de las dos llamadas está en vuelo, `Notificaciones`
guarda el `id` en `procesandoId` y se lo pasa a `ItemNotificacion` como
`deshabilitado`, que inhabilita sus botones de aceptar/rechazar — evita un
doble envío si el usuario hace doble clic o la red tarda.
