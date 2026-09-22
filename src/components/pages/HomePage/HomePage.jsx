'use client';

import { useEffect, useRef, useState } from 'react';

import DefaultLayout from '../../templates/DefaultLayout';
import Conversacion from '../../organisms/Conversacion';
import ListaChats from '../../organisms/ListaChats';
import Button from '../../atoms/Button';
import Alert from '../../atoms/Alert';
import FormField from '../../molecules/FormField';
import SelectorInterlocutor from '../../molecules/SelectorInterlocutor';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import useConversacion from '../../../hooks/useConversacion';
import useMiUsuario from '../../../hooks/useMiUsuario';
import useListaChats from '../../../hooks/useListaChats';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import { validarUsername } from '../../../utils/validacionConversacion';
import styles from './HomePage.module.css';

/**
 * Sub-componente interno: solo se monta una vez hay `{yo, con}` confirmados,
 * así `useConversacion` (que abre el WebSocket y carga el historial) se
 * llama siempre de forma incondicional dentro de su propio componente —
 * `HomePage` no podría llamarlo condicionalmente sin romper las reglas de
 * hooks.
 *
 * @param {object} props
 * @param {string} props.yo
 * @param {string} props.con
 * @param {(otroUsuario: string, mensaje: object) => void} [props.onMensajeEnviado]
 *   Avisa a `ListaChats` (vía `useListaChats#registrarMensajeEnviado`) en
 *   cuanto se confirma un mensaje propio — es lo que hace aparecer un chat
 *   nuevo en la lista la primera vez, justo al mandar su primer mensaje (no
 *   antes: chat-conversacion agrupa por mensajes reales, así que hasta
 *   entonces ese chat no existe para la lista).
 */
const VistaConversacion = ({ yo, con, onMensajeEnviado }) => {
  const {
    mensajes,
    cargandoHistorial,
    errorHistorial,
    reintentarHistorial,
    conectado,
    enviarMensaje,
  } = useConversacion({ yo, con });
  const ultimoIdRegistradoRef = useRef(null);

  useEffect(() => {
    const ultimo = mensajes[mensajes.length - 1];
    if (!ultimo || ultimo.remitente !== yo) return;
    if (ultimo.id === ultimoIdRegistradoRef.current) return;
    ultimoIdRegistradoRef.current = ultimo.id;
    onMensajeEnviado?.(con, ultimo);
  }, [mensajes, yo, con, onMensajeEnviado]);

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
 *   `RegistroPage` ya lo guarda solo si te registraste aquí).
 * - **Con quién chatear (`con`)**: se elige con `SelectorInterlocutor`, en la
 *   cabecera (`InterlocutorContext`) — visible en toda pantalla que exija
 *   sesión, no solo aquí — o haciendo click en un chat de `ListaChats`, a la
 *   izquierda. No se recuerda entre recargas: no hay lista de contactos
 *   propia, es `ListaChats` (`GET /api/v1/conversaciones/{usuario}/chats`,
 *   `useListaChats`) la que hace ese papel.
 *
 * Un chat nuevo (con alguien con quien `yo` no tenía mensajes todavía) no
 * aparece en `ListaChats` solo por elegirlo en la cabecera — aparece recién
 * al mandar su primer mensaje (`onMensajeEnviado` en `VistaConversacion`
 * llama a `registrarMensajeEnviado`), porque para chat-conversacion ese chat
 * tampoco existe hasta entonces (agrupa por mensajes reales).
 */
const HomePage = () => {
  useRequiereSesion();
  const { con, establecerCon } = useInterlocutor();
  const { yo, establecerYo } = useMiUsuario();
  const {
    chats,
    cargando: cargandoChats,
    cargandoMas: cargandoMasChats,
    error: errorChats,
    hasMore: hasMoreChats,
    cargarMas: cargarMasChats,
    registrarMensajeEnviado,
  } = useListaChats(yo);

  const [valorYo, setValorYo] = useState('');
  const [errorYo, setErrorYo] = useState(null);

  useEffect(() => {
    setValorYo(yo);
  }, [yo]);

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

  const conLimpio = con.trim();
  const chateandoContigoMismo =
    Boolean(conLimpio) && conLimpio.toLowerCase() === yo.toLowerCase();

  return (
    <DefaultLayout title="Chat" headerCentro={<SelectorInterlocutor />} altoCompleto>
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
              <VistaConversacion yo={yo} con={conLimpio} onMensajeEnviado={registrarMensajeEnviado} />
            )}
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default HomePage;
