'use client';

import { useEffect, useRef, useState } from 'react';

import DefaultLayout from '../../templates/DefaultLayout';
import Conversacion from '../../organisms/Conversacion';
import ListaChats from '../../organisms/ListaChats';
import Button from '../../atoms/Button';
import Alert from '../../atoms/Alert';
import AvatarUsuario from '../../atoms/AvatarUsuario';
import FormField from '../../molecules/FormField';
import Modal from '../../molecules/Modal';
import SelectorInterlocutor from '../../molecules/SelectorInterlocutor';
import Notificaciones from '../../organisms/Notificaciones';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import useConversacion from '../../../hooks/useConversacion';
import useCanalMensajes from '../../../hooks/useCanalMensajes';
import useMiUsuario from '../../../hooks/useMiUsuario';
import useListaChats from '../../../hooks/useListaChats';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import { validarUsername } from '../../../utils/validacionConversacion';
import { reproducirSonidoEnviado, reproducirSonidoRecibido } from '../../../utils/sonidosMensajes';
import { consumirBienvenidaPendiente } from '../../../utils/bienvenida';
import styles from './HomePage.module.css';

const TITULO_BIENVENIDA = '¡Te damos la bienvenida a Chat!';
const MENSAJE_BIENVENIDA =
  'Tu cuenta se creó correctamente y ya iniciaste sesión. Para empezar, escribe el usuario de alguien en la cabecera y envíale una solicitud de chat.';

/**
 * Sub-componente interno: solo se monta una vez hay `{yo, con}` confirmados,
 * así `useConversacion` (que carga el historial y observa `canal` para los
 * mensajes en tiempo real) se llama siempre de forma incondicional dentro
 * de su propio componente — `HomePage` no podría llamarlo condicionalmente
 * sin romper las reglas de hooks.
 *
 * @param {object} props
 * @param {string} props.yo
 * @param {string} props.con
 * @param {ReturnType<typeof useCanalMensajes>} props.canal
 *   El mismo canal de mensajes que `HomePage` abre una sola vez (ver más
 *   abajo) — aquí solo se observa para pintar los mensajes de esta
 *   conversación en concreto.
 */
const VistaConversacion = ({ yo, con, canal }) => {
  const {
    mensajes,
    cargandoHistorial,
    errorHistorial,
    reintentarHistorial,
    conectado,
    enviarMensaje,
  } = useConversacion({ yo, con, canal });

  return (
    <div className={styles.vista}>
      {cargandoHistorial && <Alert tipo="info">Cargando conversación…</Alert>}

      {!cargandoHistorial && errorHistorial && (
        <Alert tipo="error">
          <div className={styles.errorConReintento}>
            <p>
              No se pudo cargar el historial de la conversación. Revisa tu conexión e
              inténtalo de nuevo.
            </p>
            <div className={styles.accionReintentar}>
              <Button variant="primary" onClick={reintentarHistorial} aria-label="Reintentar">
                <span className={styles.iconoReintentar} aria-hidden="true">
                  ↻
                </span>
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {!cargandoHistorial && !errorHistorial && (
        <Conversacion
          yo={yo}
          con={con}
          mensajes={mensajes}
          conectado={conectado}
          onEnviar={enviarMensaje}
        />
      )}
    </div>
  );
};

/**
 * Página: destino tras un inicio de sesión correcto — el chat 1 a 1 en sí,
 * conectado de verdad a `chat-conversacion` (WebSocket para mensajes en
 * tiempo real + REST para el historial — ver `src/hooks/useConversacion.js`
 * y `docs/integracion-conversacion.md`). Ya no es un placeholder: esta
 * pantalla, en `/home`, es la aplicación.
 *
 * Exige sesión activa (`useRequiereSesion`).
 *
 * Si se llega recién registrado (`RegistroPage` deja una marca de un solo
 * uso, ver `src/utils/bienvenida.js`), muestra un `Modal` de bienvenida —
 * una única vez: la marca se consume al leerla.
 *
 * **Identidad, a propósito temporal:** `chat-conversacion` identifica cada
 * lado de la conversación por `username` de chat-registro (contrato §2.1).
 *
 * - **Tu usuario (`yo`)**: lo resuelve `useMiUsuario` — `GET
 *   /api/v1/usuarios/{uid}` de chat-gateway (contrato §4.2), con el `idToken`
 *   de la sesión activa, en cuanto hay sesión (justo tras iniciarla, o al
 *   abrir la pantalla ya autenticado en otra pestaña/navegador). Si ese
 *   backend no resuelve (caído, cuenta sin perfil de chat-registro
 *   todavía...), cae a un formulario manual, aquí en la página, como
 *   respaldo — se recuerda en `localStorage` (`src/utils/miUsuario.js`;
 *   `RegistroPage` ya lo guarda solo si te registraste aquí). El mismo
 *   `GET` también resuelve `avatar` (sin respaldo en `localStorage`, a
 *   diferencia de `yo`): `AvatarUsuario`, en la cabecera, va en el slot
 *   `headerAvatar` de `DefaultLayout` — al extremo derecho, después de
 *   `ThemeToggle`, aparte de `headerActions` (`Notificaciones`) para no
 *   quedar entre los dos botones. Pinta `avatar` tal cual (el fragmento
 *   `<Blobatar .../>` que generó `AvatarPersonalizable` al registrarse, o
 *   la imagen si fuera un enlace), con el mismo automático de siempre si
 *   todavía no resolvió o si la cuenta no tiene uno.
 * - **Con quién chatear (`con`)**: se elige con `SelectorInterlocutor`, en la
 *   cabecera (`InterlocutorContext`) — visible en toda pantalla que exija
 *   sesión, no solo aquí — o haciendo click en un chat de `ListaChats`, a la
 *   izquierda. No se recuerda entre recargas: no hay lista de contactos
 *   propia, es `ListaChats` (`GET /api/v1/conversaciones/{usuario}/chats`,
 *   `useListaChats`) la que hace ese papel.
 *
 * Un chat nuevo (con alguien con quien `yo` no tenía mensajes todavía) no
 * aparece en `ListaChats` solo por elegirlo en la cabecera — aparece en
 * cuanto se confirma el primer mensaje entre ambos, enviado o recibido (ver
 * el efecto sobre `canal.ultimoMensaje`, más abajo, que llama a
 * `registrarMensajeNuevo`), porque para chat-conversacion ese chat tampoco
 * existe hasta entonces (agrupa por mensajes reales).
 *
 * **Mensajes en tiempo real, un solo canal para toda la página**
 * (`useCanalMensajes`, ver `especificacion-canal-mensajes-tiempo-real.md`):
 * antes, el WebSocket vivía dentro de `useConversacion` y solo existía con
 * una conversación abierta — un mensaje de un chat sin abrir nunca hacía
 * aparecer nada en `ListaChats`. Ahora `canal` se abre aquí, una sola vez,
 * en cuanto se conoce `yo`, y se reparte a `VistaConversacion` (para pintar
 * la conversación activa) y al efecto de abajo (para `ListaChats`,
 * independientemente de cuál esté abierta o si hay alguna).
 *
 * Ese mismo efecto también dispara un aviso sonoro (`src/utils/sonidosMensajes.js`):
 * uno para un mensaje propio confirmado, otro (más llamativo) para uno
 * recibido — incluido el caso de un chat nuevo que aparece porque alguien
 * más mandó el primero, que suena igual que cualquier otro recibido.
 */
const HomePage = () => {
  useRequiereSesion();
  const { con, establecerCon } = useInterlocutor();
  const { yo, avatar, establecerYo } = useMiUsuario();
  const canal = useCanalMensajes(yo);
  const {
    chats,
    cargando: cargandoChats,
    cargandoMas: cargandoMasChats,
    error: errorChats,
    hasMore: hasMoreChats,
    cargarMas: cargarMasChats,
    registrarMensajeNuevo,
  } = useListaChats(yo);

  const [valorYo, setValorYo] = useState('');
  const [errorYo, setErrorYo] = useState(null);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
  const ultimoIdRegistradoRef = useRef(null);

  // Solo tras un alta recién hecha (`RegistroPage` deja la marca): se consume
  // al leerla, así no vuelve a salir al recargar ni en un login posterior. En
  // un efecto, no al inicializar el estado: `sessionStorage` no existe en el
  // prerenderizado del export estático.
  useEffect(() => {
    if (consumirBienvenidaPendiente()) setMostrarBienvenida(true);
  }, []);

  useEffect(() => {
    setValorYo(yo);
  }, [yo]);

  useEffect(() => {
    const mensaje = canal.ultimoMensaje;
    if (!mensaje) return;
    if (mensaje.id === ultimoIdRegistradoRef.current) return;
    ultimoIdRegistradoRef.current = mensaje.id;

    const esPropio = mensaje.remitente === yo;
    const otroUsuario = esPropio ? mensaje.destinatario : mensaje.remitente;
    registrarMensajeNuevo(otroUsuario, mensaje);
    if (esPropio) {
      reproducirSonidoEnviado();
    } else {
      reproducirSonidoRecibido();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `registrarMensajeNuevo`
    // es estable (useCallback sin dependencias, ver useListaChats.js); solo
    // debe reaccionar a un mensaje nuevo de verdad, no a un cambio de "yo" sin
    // mensaje asociado.
  }, [canal.ultimoMensaje, yo]);

  const alCambiarYo = (evento) => {
    setValorYo(evento.target.value);
    if (errorYo) setErrorYo(null);
  };

  const alConfirmarYo = (evento) => {
    evento.preventDefault();
    const mensaje = validarUsername(valorYo);
    if (mensaje) {
      setErrorYo(mensaje);
      return;
    }
    setErrorYo(null);
    establecerYo(valorYo.trim());
  };

  const cerrarBienvenida = () => setMostrarBienvenida(false);

  const conLimpio = con.trim();
  const chateandoContigoMismo =
    Boolean(conLimpio) && conLimpio.toLowerCase() === yo.toLowerCase();

  return (
    <DefaultLayout
      title="Chat"
      headerCentro={<SelectorInterlocutor yo={yo} />}
      headerActions={<Notificaciones yo={yo} />}
      headerAvatar={<AvatarUsuario avatar={avatar} username={yo} />}
      altoCompleto
    >
      {!yo && (
        <form className={styles.identidad} onSubmit={alConfirmarYo} noValidate>
          <Alert tipo="info">
            No pudimos obtener tu usuario automáticamente — indícalo aquí una vez; se recuerda
            en este navegador para la próxima.
          </Alert>
          <FormField
            id="yo"
            label="Tu usuario"
            autoComplete="username"
            value={valorYo}
            error={errorYo}
            onChange={alCambiarYo}
          />
          <Button type="submit">Guardar</Button>
        </form>
      )}

      {yo && (
        <div className={styles.pantalla}>
          <aside className={styles.barraLateral}>
            <ListaChats
              chats={chats}
              cargando={cargandoChats}
              cargandoMas={cargandoMasChats}
              error={errorChats}
              hasMore={hasMoreChats}
              chatActivo={conLimpio}
              onCargarMas={cargarMasChats}
              onSeleccionar={establecerCon}
            />
          </aside>

          <div className={styles.principal}>
            {!conLimpio && (
              <Alert tipo="info">
                Elige un chat de la izquierda, o escribe un usuario arriba, en la cabecera, para
                empezar uno nuevo.
              </Alert>
            )}

            {conLimpio && chateandoContigoMismo && (
              <Alert tipo="error">
                No puedes chatear contigo mismo. Elige otro usuario en la cabecera.
              </Alert>
            )}

            {conLimpio && !chateandoContigoMismo && (
              <VistaConversacion yo={yo} con={conLimpio} canal={canal} />
            )}
          </div>
        </div>
      )}

      {mostrarBienvenida && (
        <Modal
          tono="info"
          titulo={TITULO_BIENVENIDA}
          mensaje={MENSAJE_BIENVENIDA}
          textoBoton="Empezar"
          onCerrar={cerrarBienvenida}
        />
      )}
    </DefaultLayout>
  );
};

export default HomePage;
