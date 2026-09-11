import styles from './Input.module.css';

/**
 * Átomo: campo de texto controlado.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {string} [props.type='text']
 * @param {string} props.value
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled=false]
 * @param {(event: React.ChangeEvent<HTMLInputElement>) => void} props.onChange
 */
const Input = ({
  id,
  name,
  type = 'text',
  value,
  placeholder,
  disabled = false,
  onChange,
}) => (
  <input
    id={id}
    name={name}
    type={type}
    className={styles.input}
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    onChange={onChange}
  />
);

export default Input;
