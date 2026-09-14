'use client';

import DefaultLayout from '../../templates/DefaultLayout';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import styles from './HomePage.module.css';

/**
 * Página: destino tras un inicio de sesión correcto.
 *
 * El contenido se pinta siempre, de inmediato — no depende de ningún fetch
 * (es un placeholder estático). `useRequiereSesion` sigue comprobando en
 * segundo plano si hay sesión activa y, si no la hay, navega a `/login`,
 * pero ya no bloquea el render mientras se resuelve esa comprobación: quien
 * entra a `/home` normalmente ya tiene sesión (es el destino tras iniciarla),
 * así que demorar la carga para el caso común no compensa.
 *
 * Placeholder deliberado: de momento solo confirma que el login funcionó;
 * el contenido real del chat (conversaciones, contactos...) es una
 * iteración futura.
 */
const HomePage = () => {
  useRequiereSesion();

  return (
    <DefaultLayout title="Chat" centered>
      <p className={styles.mensaje}>¡Sesión iniciada correctamente!</p>
    </DefaultLayout>
  );
};

export default HomePage;
