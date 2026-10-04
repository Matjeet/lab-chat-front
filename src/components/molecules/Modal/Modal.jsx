'use client';

import { useEffect, useId, useRef } from 'react';

import Button from '../../atoms/Button';
import styles from './Modal.module.css';

const SELECTOR_FOCABLES =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const BOTON_POR_TONO = { error: 'danger', info: 'primary', warning: 'warning' };
const TITULO_POR_TONO = { error: 'Ha ocurrido un error', info: 'Aviso', warning: 'Atención' };

/**
 * Molécula: el estándar único para un mensaje **bloqueante** — uno que
 * interrumpe la acción que el usuario acaba de intentar y necesita su
 * confirmación explícita antes de seguir. Tres tonos, mismo componente y
 * misma forma:
 * - `tono="error"` (rojo, botón `danger`) — algo salió mal de verdad (p. ej.
 *   "ese usuario no existe" al elegir con quién chatear).
 * - `tono="info"` (azul, botón `primary`) — no es un error, es información
 *   que igual necesita reconocerse antes de seguir (p. ej. "ya tienes una
 *   solicitud pendiente con este usuario", o la confirmación de que una
 *   solicitud se envió).
 * - `tono="warning"` (amarillo, botón `warning`) — algo que no es un error
 *   ni mera información, sino una advertencia (p. ej. una función que
 *   todavía está en construcción).
 *
 * No sustituye a `Alert` (avisos de pantalla que conviven con el resto del
 * contenido) ni al error inline de `FormField` (validación de un campo
 * mientras se escribe): ver `docs/sistema-de-diseno.md` → "Modal" para el
 * criterio de cuándo usar cada uno.
 *
 * Siempre misma forma: título + mensaje + un único botón de confirmación.
 * Se cierra de tres formas equivalentes — botón, tecla Escape, o clic en el
 * fondo — todas disparan `onCerrar`. El padre controla el montaje (igual que
 * `Alert`): no hay prop `abierto`, se muestra condicionalmente
 * (`{error && <Modal ... />}`).
 *
 * @param {object} props
 * @param {'error'|'info'|'warning'} [props.tono='error']
 * @param {string} [props.titulo]  Por defecto, uno genérico según `tono`.
 * @param {React.ReactNode} props.mensaje
 * @param {() => void} props.onCerrar
 * @param {string} [props.textoBoton='Entendido']
 */
const Modal = ({
  tono = 'error',
  titulo = TITULO_POR_TONO[tono],
  mensaje,
  onCerrar,
  textoBoton = 'Entendido',
}) => {
  const tituloId = useId();
  const mensajeId = useId();
  const dialogoRef = useRef(null);

  useEffect(() => {
    const elementoPrevio = document.activeElement;
    dialogoRef.current?.focus();

    const alTeclear = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar();
        return;
      }
      if (evento.key !== 'Tab') return;

      const focables = dialogoRef.current?.querySelectorAll(SELECTOR_FOCABLES);
      if (!focables || focables.length === 0) return;
      const primero = focables[0];
      const ultimo = focables[focables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      if (elementoPrevio instanceof HTMLElement) elementoPrevio.focus();
    };
  }, [onCerrar]);

  return (
    <div className={styles.fondo} onClick={onCerrar}>
      <div
        ref={dialogoRef}
        className={`${styles.dialogo} ${styles[tono] || ''}`.trim()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={mensajeId}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={tituloId} className={`${styles.titulo} ${styles[tono] || ''}`.trim()}>
          {titulo}
        </h2>
        <p id={mensajeId} className={styles.mensaje}>
          {mensaje}
        </p>
        <div className={styles.acciones}>
          <Button variant={BOTON_POR_TONO[tono]} onClick={onCerrar}>
            {textoBoton}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
