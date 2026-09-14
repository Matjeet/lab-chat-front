'use client';

import DefaultLayout from '../../templates/DefaultLayout';
import CargandoSesion from '../../templates/CargandoSesion';
import useRequiereSesion from '../../../hooks/useRequiereSesion';
import styles from './HomePage.module.css';

/**
 * Página: destino tras un inicio de sesión correcto.
 *
 * Exige sesión activa (`useRequiereSesion`) — sin ella, navega a `/login` en
 * vez de mostrar nada. Mientras se comprueba, `CargandoSesion` (mismo
 * aspecto que usan `LoginPage`/`RegistroPage` en su propia comprobación,
 * a propósito — ver ese componente) evita que la llegada aquí desde una
 * redirección se perciba como un parpadeo.
 *
 * Placeholder deliberado: de momento solo confirma que el login funcionó;
 * el contenido real del chat (conversaciones, contactos...) es una
 * iteración futura.
 */
const HomePage = () => {
  const { verificando } = useRequiereSesion();

  if (verificando) {
    return <CargandoSesion />;
  }

  return (
    <DefaultLayout title="Chat" centered>
      <p className={styles.mensaje}>¡Sesión iniciada correctamente!</p>
    </DefaultLayout>
  );
};

export default HomePage;
