'use client';

import { useEffect, useState } from 'react';

import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import Modal from '../Modal';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import useExisteUsuario from '../../../hooks/useExisteUsuario';
import useCrearSolicitudChat from '../../../hooks/useCrearSolicitudChat';
import { validarUsername } from '../../../utils/validacionConversacion';
import styles from './SelectorInterlocutor.module.css';

const TITULO_NO_EXISTE = 'Usuario no encontrado';
const MENSAJE_NO_EXISTE = 'No existe ningún usuario con ese nombre. Revisa que esté bien escrito.';
const TITULO_ERROR_COMPROBACION = 'No se pudo comprobar';
const MENSAJE_ERROR_COMPROBACION = 'No se pudo comprobar el usuario. Inténtalo de nuevo.';
const TITULO_SOLICITUD_DUPLICADA = 'Ya tienes una solicitud pendiente';
const MENSAJE_SOLICITUD_DUPLICADA =
  'Ya existe una solicitud de chat pendiente con este usuario, en cualquiera de los dos sentidos. Espera a que se acepte.';
const TITULO_ERROR_SOLICITUD = 'No se pudo enviar la solicitud';
const MENSAJE_ERROR_SOLICITUD = 'No se pudo enviar la solicitud de chat. Inténtalo de nuevo.';
const MENSAJE_ERROR_SOLICITUD_VALIDACION = 'No puedes enviarte una solicitud de chat a ti mismo.';
const TITULO_SOLICITUD_ENVIADA = 'Solicitud enviada';
const DURACION_AVISO_EXITO_MS = 5000;

/**
 * Molécula: elige con quién chatear, desde la cabecera. Vive en
 * `headerActions` de `DefaultLayout`, solo en las páginas que exigen sesión
 * (`HomePage`, `StyleGuidePage`) — nunca en `/login` ni `/registro`.
 *
 * **Ya no abre el chat directamente**: manda una *solicitud* de chat
 * (`useCrearSolicitudChat`, `POST /api/v1/conversaciones/solicitudes`,
 * chat-gateway) que el otro usuario debe aceptar — ver
 * `docs/integracion-conversacion.md`. Por eso, a diferencia de antes, ya no
 * escribe en `InterlocutorContext` al enviar (`establecerCon` solo lo llama
 * `ListaChats`, para abrir un chat que ya existe — ese camino no cambia:
 * el endpoint que abre la conversación directamente sigue ahí, solo que
 * ahora lo dispara otra parte de la UI).
 *
 * Controla su propio valor de input y, al enviar, sigue tres pasos antes de
 * mandar la solicitud:
 * 1. Formato válido (`validarUsername`) — igual que `CampoMensaje`, para no
 *    propagar un username a medio escribir.
 * 2. El usuario **existe de verdad** en chat-registro (`useExisteUsuario`,
 *    `GET /api/v1/usuarios/existe`, chat-gateway contrato §4.6) — para no
 *    pedir una solicitud hacia alguien que no está en la aplicación.
 * 3. Se crea la solicitud con `yo` (el username autenticado, recibido por
 *    prop — quien la llama ya lo resolvió, p. ej. `useMiUsuario` en
 *    `HomePage`) como `solicitante`. Si se crea, se muestra un `Modal`
 *    `tono="info"` explicando que el chat empieza cuando el otro usuario la
 *    acepte — nunca abre la conversación en el momento. Ese modal, además de
 *    sus formas normales de cerrarse, también se cierra solo (a los
 *    `DURACION_AVISO_EXITO_MS`) o con un clic en cualquier parte de la
 *    aplicación (el propio fondo del modal ya cubre "cualquier parte") — no
 *    tiene sentido que una confirmación se quede en pantalla indefinidamente
 *    si nadie la descarta.
 * Mientras cualquiera de las dos llamadas está en vuelo, deshabilita el
 * campo y el botón (evita un doble envío con la respuesta anterior todavía
 * sin resolver).
 *
 * Tres formas de mensaje, cada una la que le corresponde (ver
 * `docs/sistema-de-diseno.md` → "Modal"): un formato inválido
 * (`validarUsername`, o el `kind: 'validacion'` que puede devolver
 * cualquiera de los dos backends — incluido pedirte una solicitud a ti
 * mismo) es un error **de campo** — se corrige sin perder el resto del
 * formulario, se muestra inline junto al input. Que el usuario no exista, o
 * que alguna de las dos comprobaciones falle, es un error **bloqueante** de
 * verdad — `Modal` `tono="error"`. Que ya haya una solicitud **pendiente**
 * con ese usuario (`kind: 'duplicada'`, 409 — una solicitud ya resuelta no
 * cuenta, aunque hoy no hay forma de llegar a ese estado), o que la propia
 * solicitud se haya enviado, no son errores — son información que también
 * corta el flujo, así que usan `Modal` `tono="info"` (azul, no rojo).
 *
 * @param {object} props
 * @param {string} [props.yo='']  username autenticado, dueño de la solicitud
 *   que se va a crear. Sin él (p. ej. la instancia de demostración en
 *   `StyleGuidePage`) la solicitud fallará con un error de validación del
 *   backend — aceptable ahí, no es una pantalla funcional.
 */
const SelectorInterlocutor = ({ yo = '' }) => {
  const { con } = useInterlocutor();
  const comprobarUsuario = useExisteUsuario();
  const crearSolicitud = useCrearSolicitudChat();
  const [valor, setValor] = useState(con);
  const [errorCampo, setErrorCampo] = useState(null);
  const [modalAviso, setModalAviso] = useState(null);
  const [solicitudEnviadaA, setSolicitudEnviadaA] = useState(null);
  const [comprobando, setComprobando] = useState(false);

  useEffect(() => {
    if (!solicitudEnviadaA) return undefined;

    const temporizador = setTimeout(() => setSolicitudEnviadaA(null), DURACION_AVISO_EXITO_MS);
    const alClicEnCualquierParte = () => setSolicitudEnviadaA(null);
    document.addEventListener('click', alClicEnCualquierParte);

    return () => {
      clearTimeout(temporizador);
      document.removeEventListener('click', alClicEnCualquierParte);
    };
  }, [solicitudEnviadaA]);

  const alCambiar = (evento) => {
    setValor(evento.target.value);
    if (errorCampo) setErrorCampo(null);
    if (solicitudEnviadaA) setSolicitudEnviadaA(null);
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const mensaje = validarUsername(valor);
    if (mensaje) {
      setErrorCampo(mensaje);
      return;
    }

    const limpio = valor.trim();
    setErrorCampo(null);
    setSolicitudEnviadaA(null);
    setComprobando(true);

    const resultadoExiste = await comprobarUsuario(limpio);
    if (!resultadoExiste.ok) {
      setComprobando(false);
      if (resultadoExiste.error.kind === 'validacion') {
        setErrorCampo(resultadoExiste.error.mensaje);
        return;
      }
      setModalAviso({ tono: 'error', titulo: TITULO_ERROR_COMPROBACION, mensaje: MENSAJE_ERROR_COMPROBACION });
      return;
    }
    if (!resultadoExiste.data.existe) {
      setComprobando(false);
      setModalAviso({ tono: 'error', titulo: TITULO_NO_EXISTE, mensaje: MENSAJE_NO_EXISTE });
      return;
    }

    const resultadoSolicitud = await crearSolicitud(yo, limpio);
    setComprobando(false);

    if (!resultadoSolicitud.ok) {
      if (resultadoSolicitud.error.kind === 'validacion') {
        setErrorCampo(resultadoSolicitud.error.mensaje || MENSAJE_ERROR_SOLICITUD_VALIDACION);
        return;
      }
      if (resultadoSolicitud.error.kind === 'duplicada') {
        setModalAviso({ tono: 'info', titulo: TITULO_SOLICITUD_DUPLICADA, mensaje: MENSAJE_SOLICITUD_DUPLICADA });
        return;
      }
      setModalAviso({ tono: 'error', titulo: TITULO_ERROR_SOLICITUD, mensaje: MENSAJE_ERROR_SOLICITUD });
      return;
    }

    setValor('');
    setSolicitudEnviadaA(limpio);
  };

  return (
    <form className={styles.form} onSubmit={alEnviar} noValidate>
      <label htmlFor="selector-interlocutor" className={styles.label}>
        Chatear con
      </label>
      <div className={styles.campo}>
        <Input
          id="selector-interlocutor"
          name="con"
          value={valor}
          placeholder="usuario"
          disabled={comprobando}
          aria-invalid={errorCampo ? 'true' : undefined}
          aria-describedby={errorCampo ? 'selector-interlocutor-error' : undefined}
          onChange={alCambiar}
        />
      </div>
      <Button type="submit" disabled={comprobando}>
        Ir
      </Button>
      {errorCampo && (
        <p id="selector-interlocutor-error" role="alert" className={styles.error}>
          {errorCampo}
        </p>
      )}
      {solicitudEnviadaA && (
        <Modal
          tono="info"
          titulo={TITULO_SOLICITUD_ENVIADA}
          mensaje={
            <>
              Solicitud enviada a <strong>{solicitudEnviadaA}</strong>. El chat empezará en cuanto la{' '}
              <strong>acepte</strong>.
            </>
          }
          onCerrar={() => setSolicitudEnviadaA(null)}
        />
      )}
      {modalAviso && (
        <Modal
          tono={modalAviso.tono}
          titulo={modalAviso.titulo}
          mensaje={modalAviso.mensaje}
          onCerrar={() => setModalAviso(null)}
        />
      )}
    </form>
  );
};

export default SelectorInterlocutor;
