import styles from './Header.module.css';

/**
 * Organismo: cabecera de la aplicación.
 *
 * @param {object} props
 * @param {string} props.title            Título principal.
 * @param {React.ReactNode} [props.actions] Acciones a la derecha (botones, enlaces...).
 */
const Header = ({ title, actions }) => (
  <header className={styles.header}>
    <h1 className={styles.title}>{title}</h1>
    {actions && <nav className={styles.actions}>{actions}</nav>}
  </header>
);

export default Header;
