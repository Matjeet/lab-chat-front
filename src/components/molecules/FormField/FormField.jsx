import Input from '../../atoms/Input';
import styles from './FormField.module.css';

/**
 * Molécula: etiqueta + ayuda opcional + input + mensaje de error opcional.
 * Enlaza todo por accesibilidad (`htmlFor`, `aria-describedby`, `aria-invalid`).
 *
 * @param {object} props
 * @param {string} props.id     Id que enlaza label e input.
 * @param {string} props.label  Texto de la etiqueta.
 * @param {string} [props.hint]  Texto de ayuda bajo la etiqueta (reglas del campo).
 * @param {string} [props.error] Mensaje de error a mostrar.
 * @param {...any} props.inputProps Resto de props que se pasan al Input.
 */
const FormField = ({ id, label, hint, error, ...inputProps }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

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
      />
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
