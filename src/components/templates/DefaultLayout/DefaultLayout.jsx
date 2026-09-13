import Header from '../../organisms/Header';
import ThemeToggle from '../../molecules/ThemeToggle';
import PatronBurbujas from '../../atoms/PatronBurbujas';
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
 * @param {boolean} [props.tarjeta=false]   Solo tiene efecto junto a `centered`:
 *   pone `children` dentro de una tarjeta (fondo sólido, bordes redondeados)
 *   sobre un fondo animado de burbujas (`PatronBurbujas`). Pensado para
 *   pantallas de login/registro; el 404 (con su propia ilustración) usa
 *   `centered` sin `tarjeta`.
 * @param {React.ReactNode} props.children  Contenido principal de la pantalla.
 */
const DefaultLayout = ({
  title,
  headerActions,
  centered = false,
  tarjeta = false,
  children,
}) => (
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
      className={`${styles.content} ${centered ? styles.centered : ''} ${
        centered && tarjeta ? styles.conPatron : ''
      }`.trim()}
    >
      {centered && tarjeta && <PatronBurbujas />}
      {centered ? (
        <div
          className={`${styles.centeredInner} ${tarjeta ? styles.tarjeta : ''}`.trim()}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </main>
    <footer className={styles.footer}>
      <small>Proyecto Chat · Atomic Design</small>
    </footer>
  </div>
);

export default DefaultLayout;
