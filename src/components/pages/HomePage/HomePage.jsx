import DefaultLayout from '../../templates/DefaultLayout';
import styles from './HomePage.module.css';

/**
 * Página: destino tras un inicio de sesión correcto.
 *
 * Placeholder deliberado — de momento solo confirma que el login funcionó;
 * el contenido real del chat (conversaciones, contactos...) es una
 * iteración futura. Sin estado ni efectos: no necesita `'use client'`.
 *
 * Sin protección de ruta todavía: cualquiera puede entrar a `/home`
 * directamente, no solo quien acaba de iniciar sesión. Eso depende de cómo
 * se maneje la sesión frente al backend (aún sin decidir, ver
 * `src/firebase/auth.js`), no de esta página.
 */
const HomePage = () => (
  <DefaultLayout title="Chat" centered>
    <p className={styles.mensaje}>¡Sesión iniciada correctamente!</p>
  </DefaultLayout>
);

export default HomePage;
