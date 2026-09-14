'use client';

import { useState } from 'react';
import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import CargandoSesion from '../../templates/CargandoSesion';
import RegistroForm from '../../organisms/RegistroForm';
import Alert from '../../atoms/Alert';
import useRedirigirSiHaySesion from '../../../hooks/useRedirigirSiHaySesion';
import styles from './RegistroPage.module.css';

/**
 * Página: alta de usuario.
 *
 * Antes de mostrar el formulario, `useRedirigirSiHaySesion` comprueba si ya
 * hay sesión de Firebase activa — si la hay, no tiene sentido crear otra
 * cuenta: navega a `/home` (mismo criterio que `LoginPage`). Mientras se
 * resuelve esa comprobación se ve `CargandoSesion`, con el mismo aspecto
 * exacto que usan `LoginPage`/`HomePage` en la suya — ver ese componente
 * para el porqué (evita que la transición se perciba como un parpadeo).
 *
 * El alta en sí **no** autentica al cliente contra Firebase (la crea
 * `chat-registro` con el Admin SDK, ver `src/api/registro.js`), así que
 * terminar un registro con éxito nunca dispara esta redirección a mitad de
 * la confirmación: mientras no exista un botón de cerrar sesión en la app,
 * quien ya tenga sesión activa no puede volver aquí desde la UI sin borrar
 * su sesión a mano.
 *
 * Mientras no hay alta muestra el formulario; al completarse, la confirmación
 * con los datos que devuelve el servidor (nunca la contraseña).
 */
const RegistroPage = () => {
  const [usuario, setUsuario] = useState(null);
  const { comprobando } = useRedirigirSiHaySesion();

  if (comprobando) {
    return <CargandoSesion />;
  }

  return (
    <DefaultLayout title="Crear cuenta" centered tarjeta>
      {usuario ? (
        <div className={styles.exito}>
          <Alert tipo="success">
            Cuenta creada correctamente. Ya puedes{' '}
            <Link href="/login" className={styles.enlace}>
              iniciar sesión
            </Link>{' '}
            con <strong>{usuario.username}</strong>.
          </Alert>
          <dl className={styles.datos}>
            <div>
              <dt>Usuario</dt>
              <dd>{usuario.username}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{usuario.email}</dd>
            </div>
          </dl>
          <Link href="/" className={styles.enlace}>
            Volver al inicio
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.intro}>
            Crea tu cuenta para empezar a usar Chat.
          </p>
          <RegistroForm onRegistroCompleto={setUsuario} />
        </>
      )}
    </DefaultLayout>
  );
};

export default RegistroPage;
