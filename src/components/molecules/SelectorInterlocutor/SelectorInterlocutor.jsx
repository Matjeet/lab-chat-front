'use client';

import { useState } from 'react';

import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import ModalError from '../ModalError';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import useExisteUsuario from '../../../hooks/useExisteUsuario';
import { validarUsername } from '../../../utils/validacionConversacion';
import styles from './SelectorInterlocutor.module.css';

const TITULO_NO_EXISTE = 'Usuario no encontrado';
const MENSAJE_NO_EXISTE = 'No existe ningún usuario con ese nombre. Revisa que esté bien escrito.';
const TITULO_ERROR_COMPROBACION = 'No se pudo comprobar';
const MENSAJE_ERROR_COMPROBACION = 'No se pudo comprobar el usuario. Inténtalo de nuevo.';

/**
 * Molécula: elige con quién chatear, desde la cabecera. Vive en
 * `headerActions` de `DefaultLayout`, solo en las páginas que exigen sesión
 * (`HomePage`, `StyleGuidePage`) — nunca en `/login` ni `/registro`. Escribe
 * en `InterlocutorContext` (`con`), que `HomePage` lee para decidir qué
 * conversación abrir; ella sola no sabe nada de conversaciones.
 *
 * Controla su propio valor de input y, al enviar, confirma en
 * `InterlocutorContext` solo tras dos pasos:
 * 1. Formato válido (`validarUsername`) — igual que `CampoMensaje`, para no
 *    propagar un username a medio escribir.
 * 2. El usuario **existe de verdad** en chat-registro (`useExisteUsuario`,
 *    `GET /api/v1/usuarios/existe`, chat-gateway contrato §4.6) — para no
 *    abrir un chat con alguien que no está en la aplicación. Mientras
 *    comprueba, deshabilita el campo y el botón (evita un doble envío con
 *    la respuesta anterior todavía en vuelo).
 *
 * Dos tipos de error, dos formas distintas a propósito (ver
 * `docs/sistema-de-diseno.md` → "Modal de error"): un formato inválido
 * (`validarUsername`, o el `kind: 'validacion'` que puede devolver el
 * backend) es un error **de campo** — se corrige sin perder el resto del
 * formulario, se muestra inline junto al input. Que el usuario no exista, o
 * que la comprobación en sí falle (red, servidor, sesión), es un error
 * **bloqueante** — corta el flujo y exige que el usuario lo reconozca antes
 * de seguir — se muestra con `ModalError`.
 */
const SelectorInterlocutor = () => {
  const { con, establecerCon } = useInterlocutor();
  const comprobarUsuario = useExisteUsuario();
  const [valor, setValor] = useState(con);
  const [errorCampo, setErrorCampo] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [comprobando, setComprobando] = useState(false);

  const alCambiar = (evento) => {
    setValor(evento.target.value);
    if (errorCampo) setErrorCampo(null);
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
    setComprobando(true);
    const resultado = await comprobarUsuario(limpio);
    setComprobando(false);

    if (!resultado.ok) {
      if (resultado.error.kind === 'validacion') {
        setErrorCampo(resultado.error.mensaje);
        return;
      }
      setErrorModal({ titulo: TITULO_ERROR_COMPROBACION, mensaje: MENSAJE_ERROR_COMPROBACION });
      return;
    }
    if (!resultado.data.existe) {
      setErrorModal({ titulo: TITULO_NO_EXISTE, mensaje: MENSAJE_NO_EXISTE });
      return;
    }
    establecerCon(limpio);
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
      {errorModal && (
        <ModalError
          titulo={errorModal.titulo}
          mensaje={errorModal.mensaje}
          onCerrar={() => setErrorModal(null)}
        />
      )}
    </form>
  );
};

export default SelectorInterlocutor;
