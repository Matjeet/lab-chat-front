import styles from './Button.module.css';

/**
 * Átomo: botón reutilizable.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children  Contenido del botón.
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant='primary']
 * @param {boolean} [props.disabled=false]
 * @param {() => void} [props.onClick]
 * @param {object} [props.rest]  Resto de atributos nativos (aria-*, name, ...).
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  ...rest
}) => (
  <button
    type={type}
    className={`${styles.button} ${styles[variant] || ''}`.trim()}
    disabled={disabled}
    onClick={onClick}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
