import Header from '../../organisms/Header';
import ThemeToggle from '../../molecules/ThemeToggle';
import styles from './DefaultLayout.module.css';

/**
 * Plantilla: estructura visual base de una pantalla (cabecera + contenido + pie).
 * No conoce datos concretos; solo define dónde va cada cosa.
 * El selector de tema está siempre presente en la cabecera.
 *
 * @param {object} props
 * @param {string} props.title              Título para la cabecera.
 * @param {React.ReactNode} [props.headerActions] Acciones extra a la izquierda del selector de tema.
 * @param {boolean} [props.centered=false]  Centra `children` vertical y
 *   horizontalmente en el espacio disponible (para pantallas de un solo
 *   formulario/tarjeta, p. ej. registro o login). Por defecto el contenido
 *   fluye normal desde arriba.
 * @param {React.ReactNode} props.children  Contenido principal de la pantalla.
 */
const DefaultLayout = ({ title, headerActions, centered = false, children }) => (
  <div className={styles.layout}>
    <Header
      title={title}
      actions={
        <>
          {headerActions}
          <ThemeToggle />
        </>
      }
    />
    <main
      className={`${styles.content} ${centered ? styles.centered : ''}`.trim()}
    >
      {centered ? <div className={styles.centeredInner}>{children}</div> : children}
    </main>
    <footer className={styles.footer}>
      <small>Proyecto Chat · Atomic Design</small>
    </footer>
  </div>
);

export default DefaultLayout;
