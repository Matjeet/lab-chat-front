'use client';

import { useEffect, useState } from 'react';

import DefaultLayout from '../../templates/DefaultLayout';
import Conversacion from '../../organisms/Conversacion';
import Button from '../../atoms/Button';
import Alert from '../../atoms/Alert';
import FormField from '../../molecules/FormField';
import SelectorInterlocutor from '../../molecules/SelectorInterlocutor';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import useConversacion from '../../../hooks/useConversacion';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import { validarUsername } from '../../../utils/validacionConversacion';
import { guardarMiUsuario, leerMiUsuario } from '../../../utils/miUsuario';
import styles from './HomePage.module.css';

/**
 * Sub-componente interno: solo se monta una vez hay `{yo, con}` confirmados,
 * así `useConversacion` (que abre el WebSocket y carga el historial) se
 * llama siempre de forma incondicional dentro de su propio componente —
 * `HomePage` no podría llamarlo condicionalmente sin romper las reglas de
 * hooks.
 */
const VistaConversacion = ({ yo, con }) => {
  const { mensajes, cargandoHistorial, errorHistorial, conectado, enviarMensaje } =
    useConversacion({ yo, con });

  return (
    <div className={styles.vista}>
      {cargandoHistorial && <Alert tipo="info">Cargando conversación…</Alert>}

      {!cargandoHistorial && errorHistorial && (
        <Alert tipo="error">
          No se pudo cargar el historial de la conversación. Revisa tu conexión e inténtalo
          de nuevo.
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
 * lado de la conversación por `username` de chat-registro (contrato §2.1),
 * pero el login de este frontend es con Firebase y no expone ese username
 * en ningún sitio — chat-registro no tiene un endpoint para resolverlo a
 * partir del `uid`/email de la sesión.
 *
 * - **Tu usuario (`yo`)**: se pide una vez, aquí en la página, y se recuerda
 *   en este navegador (`src/utils/miUsuario.js`; `RegistroPage` ya lo guarda
 *   solo si te registraste aquí).
 * - **Con quién chatear (`con`)**: se elige con `SelectorInterlocutor`, en la
 *   cabecera (`InterlocutorContext`) — visible en toda pantalla que exija
 *   sesión, no solo aquí. No se recuerda entre recargas: no hay lista de
 *   contactos todavía, es solo la conversación activa de esta sesión de
 *   navegación.
 */
const HomePage = () => {
  useRequiereSesion();
  const { con } = useInterlocutor();

  const [yo, setYo] = useState('');
  const [valorYo, setValorYo] = useState('');
  const [errorYo, setErrorYo] = useState(null);

  useEffect(() => {
    const guardado = leerMiUsuario();
    setYo(guardado);
    setValorYo(guardado);
  }, []);

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
    const limpio = valorYo.trim();
    setErrorYo(null);
    guardarMiUsuario(limpio);
    setYo(limpio);
  };

  const conLimpio = con.trim();
  const chateandoContigoMismo =
    Boolean(conLimpio) && conLimpio.toLowerCase() === yo.toLowerCase();

  return (
    <DefaultLayout title="Chat" headerActions={<SelectorInterlocutor />}>
      {!yo && (
        <form className={styles.identidad} onSubmit={alConfirmarYo} noValidate>
          <Alert tipo="info">
            Todavía no hay forma de saber tu usuario de chat-registro a partir de tu sesión —
            indícalo aquí una vez; se recuerda en este navegador para la próxima.
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

      {yo && !conLimpio && (
        <Alert tipo="info">Elige con quién chatear arriba, en la cabecera, para empezar.</Alert>
      )}

      {yo && conLimpio && chateandoContigoMismo && (
        <Alert tipo="error">
          No puedes chatear contigo mismo. Elige otro usuario en la cabecera.
        </Alert>
      )}

      {yo && conLimpio && !chateandoContigoMismo && (
        <VistaConversacion yo={yo} con={conLimpio} />
      )}
    </DefaultLayout>
  );
};

export default HomePage;
