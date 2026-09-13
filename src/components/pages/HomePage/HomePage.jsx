'use client';

import DefaultLayout from '../../templates/DefaultLayout';
import Alert from '../../atoms/Alert';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import styles from './HomePage.module.css';

/**
 * Página: destino tras un inicio de sesión correcto.
 *
 * Exige sesión activa (`useRequiereSesion`) — sin ella, navega a `/login` en
 * vez de mostrar nada. Placeholder deliberado: de momento solo confirma que
 * el login funcionó; el contenido real del chat (conversaciones,
 * contactos...) es una iteración futura.
 */
const HomePage = () => {
  const { verificando } = useRequiereSesion();

  return (
    <DefaultLayout title="Chat" centered>
      {verificando ? (
        <Alert tipo="info">Comprobando sesión…</Alert>
      ) : (
        <p className={styles.mensaje}>¡Sesión iniciada correctamente!</p>
      )}
    </DefaultLayout>
  );
};

export default HomePage;
