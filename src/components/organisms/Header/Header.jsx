import Link from 'next/link';

import styles from './Header.module.css';

/**
 * Organismo: cabecera de la aplicación.
 *
 * La marca (logo + "Chat") es fija en toda la app y enlaza a `/`. No hace
 * falta que este componente sepa nada de autenticación: `/` ya decide sola
 * a dónde ir — si hay sesión de Firebase activa, `LoginPage` redirige a
 * `/home`; si no, se queda mostrando el login (ver `observarSesion` en
 * `src/firebase/auth.js`).
 *
 * @param {object} props
 * @param {string} props.title             Título de la página (h1).
 * @param {React.ReactNode} [props.actions] Acciones a la derecha (botones, enlaces...).
 */
const Header = ({ title, actions }) => (
  <header className={styles.header}>
    <div className={styles.izquierda}>
      <Link href="/" className={styles.marca}>
        <img src="/chat-logo.webp" alt="" className={styles.logo} />
        <span className={styles.nombreApp}>Chat</span>
      </Link>
      <h1 className={styles.title}>{title}</h1>
    </div>
    {actions && <nav className={styles.actions}>{actions}</nav>}
  </header>
);

export default Header;
