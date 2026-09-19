'use client';

import { useState } from 'react';

import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import { validarUsername } from '../../../utils/validacionConversacion';
import styles from './SelectorInterlocutor.module.css';

/**
 * Molécula: elige con quién chatear, desde la cabecera. Vive en
 * `headerActions` de `DefaultLayout`, solo en las páginas que exigen sesión
 * (`HomePage`, `StyleGuidePage`) — nunca en `/login` ni `/registro`. Escribe
 * en `InterlocutorContext` (`con`), que `HomePage` lee para decidir qué
 * conversación abrir; ella sola no sabe nada de conversaciones.
 *
 * Controla su propio valor de input y solo confirma en `InterlocutorContext`
 * tras validar el formato (`validarUsername`) — igual que `CampoMensaje`,
 * para no propagar un username a medio escribir.
 */
const SelectorInterlocutor = () => {
  const { con, establecerCon } = useInterlocutor();
  const [valor, setValor] = useState(con);
  const [error, setError] = useState(null);

  const alCambiar = (evento) => {
    setValor(evento.target.value);
    if (error) setError(null);
  };

  const alEnviar = (evento) => {
    evento.preventDefault();
    const mensaje = validarUsername(valor);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);
    establecerCon(valor.trim());
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
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'selector-interlocutor-error' : undefined}
          onChange={alCambiar}
        />
      </div>
      <Button type="submit">Ir</Button>
      {error && (
        <p id="selector-interlocutor-error" role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
};

export default SelectorInterlocutor;
