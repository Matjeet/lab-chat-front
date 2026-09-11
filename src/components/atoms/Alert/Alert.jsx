import styles from './Alert.module.css';

const ROL = { error: 'alert', success: 'status', info: 'status' };

/**
 * Átomo: mensaje destacado a nivel de bloque (error, éxito o información).
 * `error` usa role="alert" (interrumpe al lector de pantalla); el resto, "status".
 *
 * @param {object} props
 * @param {'error'|'success'|'info'} [props.tipo='info']
 * @param {React.ReactNode} props.children
 * @param {object} [props.rest]
 */
const Alert = ({ tipo = 'info', children, ...rest }) => (
  <div
    className={`${styles.alert} ${styles[tipo] || ''}`.trim()}
    role={ROL[tipo] || 'status'}
    {...rest}
  >
    {children}
  </div>
);

export default Alert;
