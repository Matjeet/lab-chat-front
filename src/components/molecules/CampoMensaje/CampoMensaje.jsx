'use client';

import { useState } from 'react';

import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import styles from './CampoMensaje.module.css';

/**
 * Molécula: campo para escribir y enviar un mensaje. Controla su propio
 * valor y lo limpia tras un envío correcto; el envío en sí (validación
 * incluida) lo decide quien la usa a través de `onEnviar` — ver
 * `useConversacion#enviarMensaje`, cuyo resultado tipado encaja aquí tal cual.
 *
 * El botón de envío es un ícono (➤), no el texto "Enviar" — mismo patrón que
 * `ThemeToggle` y el botón "Reintentar" de `HomePage`: el símbolo va con
 * `aria-hidden`, el nombre accesible real vive en el `aria-label` del botón.
 *
 * @param {object} props
 * @param {(contenido: string) => {ok: boolean, error?: {mensaje: string}}} props.onEnviar
 * @param {boolean} [props.disabled=false]
 */
const CampoMensaje = ({ onEnviar, disabled = false }) => {
  const [valor, setValor] = useState('');
  const [error, setError] = useState(null);

  const alCambiar = (evento) => {
    setValor(evento.target.value);
    if (error) setError(null);
  };

  const enviar = (evento) => {
    evento.preventDefault();
    const resultado = onEnviar(valor);
    if (resultado.ok) {
      setValor('');
      setError(null);
    } else {
      setError(resultado.error?.mensaje ?? 'No se pudo enviar el mensaje.');
    }
  };

  return (
    <form className={styles.form} onSubmit={enviar} noValidate>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.fila}>
        <Input
          id="campo-mensaje"
          name="mensaje"
          value={valor}
          placeholder="Escribe un mensaje…"
          disabled={disabled}
          onChange={alCambiar}
          aria-label="Mensaje"
        />
        <Button type="submit" disabled={disabled} aria-label="Enviar">
          <span className={styles.iconoEnviar} aria-hidden="true">
            ➤
          </span>
        </Button>
      </div>
    </form>
  );
};

export default CampoMensaje;
