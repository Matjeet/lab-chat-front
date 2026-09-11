'use client';

import { useState } from 'react';

import Input from '../../atoms/Input';
import RequisitosCampo from '../RequisitosCampo';
import styles from './FormField.module.css';

/**
 * Molécula: etiqueta + ayuda opcional + input + requisitos/errores.
 * Enlaza todo por accesibilidad (`htmlFor`, `aria-describedby`, `aria-invalid`).
 *
 * La lista de `requisitos` solo se muestra mientras el input tiene el foco
 * (para no saturar la UI); cada requisito cumplido se marca en verde.
 * Mientras se ven los requisitos, se oculta el mensaje de error del campo.
 *
 * @param {object} props
 * @param {string} props.id     Id que enlaza label e input.
 * @param {string} props.label  Texto de la etiqueta.
 * @param {string} [props.hint]  Texto de ayuda fijo bajo la etiqueta.
 * @param {string} [props.error] Mensaje de error a mostrar.
 * @param {{id: string, texto: string, cumplido: boolean}[]} [props.requisitos]
 * @param {...any} props.inputProps Resto de props que se pasan al Input.
 */
const FormField = ({ id, label, hint, error, requisitos, ...inputProps }) => {
  const [enfocado, setEnfocado] = useState(false);

  const mostrarRequisitos = Boolean(requisitos?.length) && enfocado;
  const mostrarError = Boolean(error) && !mostrarRequisitos;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const requisitosId = requisitos ? `${id}-requisitos` : undefined;

  const describedBy =
    [
      hintId,
      mostrarRequisitos ? requisitosId : undefined,
      mostrarError ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const alEnfocar = (evento) => {
    setEnfocado(true);
    inputProps.onFocus?.(evento);
  };

  const alDesenfocar = (evento) => {
    setEnfocado(false);
    inputProps.onBlur?.(evento);
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <Input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...inputProps}
        onFocus={alEnfocar}
        onBlur={alDesenfocar}
      />
      {mostrarRequisitos && (
        <RequisitosCampo id={requisitosId} requisitos={requisitos} />
      )}
      {mostrarError && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
