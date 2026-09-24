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
 * El título por página ya no se ve (la marca "Chat" es fija y repetirlo al
 * lado, cambiando en cada pantalla, era ruido) — pero cada página sigue
 * necesitando su propio `<h1>` para la estructura semántica (un lector de
 * pantalla, o quien navegue por encabezados, necesita saber en qué pantalla
 * está); por eso sigue en el DOM con la clase global `sr-only` en vez de
 * borrarse del todo.
 *
 * Cabecera de tres zonas (izquierda / centro / derecha) mediante CSS Grid con
 * columnas `1fr auto 1fr`: el centro queda centrado respecto a todo el ancho
 * de la cabecera, no solo entre el ancho real de las otras dos zonas — por
 * eso `.centro` se renderiza siempre (aunque esté vacío), para no perder esa
 * columna del grid cuando no hay contenido centrado (p. ej. en `/login`).
 *
 * @param {object} props
 * @param {string} props.title             Título de la página (h1, solo para lectores de pantalla).
 * @param {React.ReactNode} [props.centro]  Contenido centrado (p. ej. `SelectorInterlocutor`).
 * @param {React.ReactNode} [props.actions] Acciones a la derecha (botones, enlaces...).
 */
const Header = ({ title, centro, actions }) => (
  <header className={styles.header}>
    <div className={styles.izquierda}>
      <Link href="/" className={styles.marca}>
        <img src="/chat-logo.webp" alt="" className={styles.logo} />
        <span className={styles.nombreApp}>Chat</span>
      </Link>
      <h1 className="sr-only">{title}</h1>
    </div>
    <div className={styles.centro}>{centro}</div>
    {actions && <nav className={styles.actions}>{actions}</nav>}
  </header>
);

export default Header;
