'use client';

import { useEffect, useState } from 'react';

import DefaultLayout from '../../templates/DefaultLayout';
import Conversacion from '../../organisms/Conversacion';
import Button from '../../atoms/Button';
import Alert from '../../atoms/Alert';
import FormField from '../../molecules/FormField';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import useConversacion from '../../../hooks/useConversacion';
import { validarIdentidad } from '../../../utils/validacionConversacion';
import { guardarMiUsuario, leerMiUsuario } from '../../../utils/miUsuario';
import styles from './ChatPage.module.css';

/**
 * Sub-componente interno: solo se monta una vez hay `{yo, con}` confirmados,
 * así `useConversacion` (que abre el WebSocket y carga el historial) se
 * llama siempre de forma incondicional dentro de su propio componente —
 * `ChatPage` no podría llamarlo condicionalmente sin romper las reglas de
 * hooks.
 */
const VistaConversacion = ({ yo, con, onCambiarInterlocutor }) => {
  const { mensajes, cargandoHistorial, errorHistorial, conectado, enviarMensaje } =
    useConversacion({ yo, con });

  return (
    <div className={styles.vista}>
      <Button variant="ghost" onClick={onCambiarInterlocutor}>
        ← Cambiar interlocutor
      </Button>

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
 * Página: vista de un chat 1 a 1 con otra persona, conectada de verdad a
 * `chat-conversacion` (WebSocket para mensajes en tiempo real + REST para
 * el historial — ver `src/hooks/useConversacion.js` y
 * `docs/integracion-conversacion.md`).
 *
 * Exige sesión activa (`useRequiereSesion`) igual que `HomePage`.
 *
 * **Identidad, a propósito temporal:** `chat-conversacion` identifica cada
 * lado de la conversación por `username` de chat-registro (contrato §2.1),
 * pero el login de este frontend es con Firebase y no expone ese username
 * en ningún sitio — chat-registro no tiene un endpoint para resolverlo a
 * partir del `uid`/email de la sesión. Mientras eso no exista, se pide una
 * vez con un formulario simple y se recuerda en este navegador
 * (`src/utils/miUsuario.js`; `RegistroPage` ya lo guarda solo si te
 * registraste aquí). Con quién chatear (`con`) no se recuerda — no hay
 * lista de contactos todavía, es solo esta vista de una conversación.
 */
const ChatPage = () => {
  useRequiereSesion();

  const [identidad, setIdentidad] = useState(null);
  const [valores, setValores] = useState({ yo: '', con: '' });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    setValores((prev) => ({ ...prev, yo: leerMiUsuario() }));
  }, []);

  const alCambiar = (campo) => (evento) => {
    const { value } = evento.target;
    setValores((prev) => ({ ...prev, [campo]: value }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  };

  const alEnviarIdentidad = (evento) => {
    evento.preventDefault();
    const datos = { yo: valores.yo.trim(), con: valores.con.trim() };
    const erroresValidacion = validarIdentidad(datos);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setErrores({});
    guardarMiUsuario(datos.yo);
    setIdentidad(datos);
  };

  if (identidad) {
    return (
      <DefaultLayout title="Chat">
        <VistaConversacion
          yo={identidad.yo}
          con={identidad.con}
          onCambiarInterlocutor={() => setIdentidad(null)}
        />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout title="Chat">
      <form className={styles.identidad} onSubmit={alEnviarIdentidad} noValidate>
        <Alert tipo="info">
          Todavía no hay forma de saber tu usuario de chat-registro a partir de tu sesión —
          indícalo aquí una vez; se recuerda en este navegador para la próxima.
        </Alert>
        <FormField
          id="yo"
          label="Tu usuario"
          autoComplete="username"
          value={valores.yo}
          error={errores.yo}
          onChange={alCambiar('yo')}
        />
        <FormField
          id="con"
          label="Chatear con"
          value={valores.con}
          error={errores.con}
          onChange={alCambiar('con')}
        />
        <Button type="submit">Entrar al chat</Button>
      </form>
    </DefaultLayout>
  );
};

export default ChatPage;
