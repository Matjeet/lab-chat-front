'use client';

import { useState } from 'react';

import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import useExisteUsuario from '../../../hooks/useExisteUsuario';
import { validarUsername } from '../../../utils/validacionConversacion';
import styles from './SelectorInterlocutor.module.css';

const MENSAJE_NO_EXISTE = 'Ese usuario no existe.';
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
 */
const SelectorInterlocutor = () => {
  const { con, establecerCon } = useInterlocutor();
  const comprobarUsuario = useExisteUsuario();
  const [valor, setValor] = useState(con);
  const [error, setError] = useState(null);
  const [comprobando, setComprobando] = useState(false);

  const alCambiar = (evento) => {
    setValor(evento.target.value);
    if (error) setError(null);
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const mensaje = validarUsername(valor);
    if (mensaje) {
      setError(mensaje);
      return;
    }

    const limpio = valor.trim();
    setError(null);
    setComprobando(true);
    const resultado = await comprobarUsuario(limpio);
    setComprobando(false);

    if (!resultado.ok) {
      setError(
        resultado.error.kind === 'validacion' ? resultado.error.mensaje : MENSAJE_ERROR_COMPROBACION,
      );
      return;
    }
    if (!resultado.data.existe) {
      setError(MENSAJE_NO_EXISTE);
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
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'selector-interlocutor-error' : undefined}
          onChange={alCambiar}
        />
      </div>
      <Button type="submit" disabled={comprobando}>
        Ir
      </Button>
      {error && (
        <p id="selector-interlocutor-error" role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
};

export default SelectorInterlocutor;
