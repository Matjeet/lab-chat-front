import styles from './Footer.module.css';

/**
 * Organismo: pie de página de la aplicación, presente en toda pantalla vía
 * `DefaultLayout`. Dos zonas fijas — marca a la izquierda, copyright a la
 * derecha — sin enlaces a propósito: no duplica la navegación que ya
 * resuelve `Header`, solo cierra la página con un pie ordenado.
 */
const Footer = () => (
  <footer className={styles.footer}>
    <span className={styles.marca}>Proyecto Chat</span>
    <span className={styles.copyright}>© {new Date().getFullYear()}</span>
  </footer>
);

export default Footer;
