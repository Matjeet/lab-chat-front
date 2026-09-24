import Header from '../../organisms/Header';
import Footer from '../../organisms/Footer';
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
 * @param {React.ReactNode} [props.headerCentro] Contenido centrado en la cabecera (p. ej. `SelectorInterlocutor`).
 * @param {React.ReactNode} [props.headerActions] Acciones extra a la izquierda del selector de tema.
 * @param {boolean} [props.centered=false]  Centra `children` vertical y
 *   horizontalmente en el espacio entre cabecera y pie (para pantallas de un
 *   solo formulario, p. ej. registro o login). Por defecto el contenido
 *   fluye normal desde arriba.
 * @param {boolean} [props.tarjeta=false]   Solo tiene efecto junto a `centered`:
 *   pone `children` dentro de una tarjeta (fondo sólido, bordes redondeados)
 *   y añade `PatronBurbujas` — un fondo animado que cubre **toda la pantalla**
 *   (detrás de cabecera, contenido y pie, no solo del área centrada). Pensado
 *   para login/registro; el 404 (con su propia ilustración) usa `centered`
 *   sin `tarjeta`.
 * @param {boolean} [props.altoCompleto=false] El layout entero queda fijo al
 *   alto de la pantalla (cabecera y pie con su tamaño natural, `children` con
 *   el resto) y el scroll, si hace falta, ocurre dentro del contenido en vez
 *   de en toda la página — pensado para pantallas tipo chat, donde algo
 *   (el campo de mensaje) debe quedar siempre visible justo encima del pie,
 *   sin desplazar la página entera para verlo. `children` es responsable de
 *   repartirse ese alto (`flex: 1; min-height: 0` en su propio contenedor,
 *   encadenado hasta la parte que realmente deba hacer scroll — ver `HomePage`).
 * @param {React.ReactNode} props.children  Contenido principal de la pantalla.
 */
const DefaultLayout = ({
  title,
  headerCentro,
  headerActions,
  centered = false,
  tarjeta = false,
  altoCompleto = false,
  children,
}) => (
  <div
    className={`${styles.layout} ${tarjeta ? styles.conPatron : ''} ${altoCompleto ? styles.layoutAltoCompleto : ''}`.trim()}
  >
    {tarjeta && <PatronBurbujas />}
    <Header
      title={title}
      centro={headerCentro}
      actions={
        <>
          {headerActions}
          <ThemeToggle />
        </>
      }
    />
    <main
      className={`${styles.content} ${centered ? styles.centered : ''} ${altoCompleto ? styles.contentAltoCompleto : ''}`.trim()}
    >
      {centered ? (
        <div className={`${styles.centeredInner} ${tarjeta ? styles.tarjeta : ''}`.trim()}>
          {children}
        </div>
      ) : (
        children
      )}
    </main>
    <Footer />
  </div>
);

export default DefaultLayout;
