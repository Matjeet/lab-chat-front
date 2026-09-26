# Integración con las notificaciones (vía chat-gateway)

Cómo consume este frontend la bandeja de notificaciones. El cliente habla
siempre con **chat-gateway** — nunca directo con `chat-notificaciones`.
Contrato completo:
[`../../chat-gateway/docs/contratos-api.md`](../../chat-gateway/docs/contratos-api.md) §4.8 y §4.9.

## Configuración

Mismo origen que el resto de la API, `NEXT_PUBLIC_API_BASE_URL`
(`src/api/config.js`) — no hay variables propias.

## Dónde vive el código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/notificaciones/notificaciones.js` | `obtenerNotificaciones(receptor, idToken, opciones)` → `GET /api/v1/notificaciones/{receptor}` (contrato §4.8, paginado por página/offset, no por cursor) y `actualizarLeida(id, uid, leida, idToken)` → `PATCH /api/v1/notificaciones/{id}` (contrato §4.9) — ambos con resultado tipado, igual que el resto de `src/api/` y `src/conversacion/`. |
| `src/hooks/useNotificaciones.js` | `{notificaciones, cargando, error, noLeidas, recargar, marcarLeida, marcarNoLeida}` — pide la bandeja en cuanto hay `receptor` y sesión, resuelve `idToken` **y** `uid` de Firebase (`actualizarLeida` compara por uid directo, no por username — ver "Quién verifica qué" abajo). |
| `src/components/atoms/ItemNotificacion/` | Un elemento del panel: arma el texto a partir de `tipo` (el backend no manda uno redactado — hoy solo existe `"solicitud"`), muestra los botones de aceptar/rechazar si aplica, y el de marcar como no leída si ya está leída. |
| `src/components/organisms/Notificaciones/` | La campana de la cabecera + el panel desplegable — scroll propio, insignia con `noLeidas`, orquesta las acciones de `ItemNotificacion` contra el hook. |

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

## Solicitudes de chat entrantes — aceptar/rechazar, hoy

Una notificación de `tipo: "solicitud"` trae dos botones de icono: aceptar
(verde, `variant="success"` de `Button`) y rechazar (rojo, `variant="danger"`).
**Ninguno de los dos consume todavía un servicio real de aceptar/rechazar —
no existe** (`chat-conversacion` no lo implementa aún, ver el `CLAUDE.md` de
la raíz, sección `chat-conversacion/`). Por eso, hoy:

- **Aceptar** hace lo único que sí existe: abre la conversación de inmediato
  con quien envió la solicitud (`InterlocutorContext#establecerCon`, el mismo
  mecanismo que ya usa `ListaChats` al elegir un chat existente), marca la
  notificación como leída, y cierra el panel.
- **Rechazar** solo marca la notificación como leída — un placeholder
  deliberado (no hay nada más que hacer sin un endpoint de verdad), a
  sustituir en cuanto ese servicio exista.

Cuando `chat-conversacion` implemente aceptar/rechazar una solicitud, estos
dos handlers (`alAceptar` y `onRechazar` en `Notificaciones`) son el único
punto que hay que tocar — `ItemNotificacion` ya expone los botones y sus
`aria-label`, no necesita cambios.
