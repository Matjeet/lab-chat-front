import Input from '../../atoms/Input';
import styles from './FormField.module.css';

/**
 * Molécula: etiqueta + input + mensaje de error opcional.
 * Combina los átomos Label (nativo) e Input.
 *
 * @param {object} props
 * @param {string} props.id     Id que enlaza label e input.
 * @param {string} props.label  Texto de la etiqueta.
 * @param {string} [props.error] Mensaje de error a mostrar.
 * @param {...any} props.inputProps Resto de props que se pasan al Input.
 */
const FormField = ({ id, label, error, ...inputProps }) => (
  <div className={styles.field}>
    <label htmlFor={id} className={styles.label}>
      {label}
    </label>
    <Input id={id} {...inputProps} />
    {error && (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    )}
  </div>
);

export default FormField;
