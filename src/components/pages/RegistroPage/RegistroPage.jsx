'use client';

import { useState } from 'react';
import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import RegistroForm from '../../organisms/RegistroForm';
import Alert from '../../atoms/Alert';
import useRedirigirSiHaySesion from '../../../hooks/useRedirigirSiHaySesion';
import styles from './RegistroPage.module.css';

/**
 * Página: alta de usuario.
 *
 * El formulario se pinta siempre, de inmediato — nada aquí necesita esperar
 * una respuesta de red. `useRedirigirSiHaySesion` sigue comprobando en
 * segundo plano si ya hay sesión de Firebase activa y, si la hay, navega a
 * `/home` (no tiene sentido crear otra cuenta estando ya autenticado), pero
 * ya no bloquea el render mientras se resuelve esa comprobación — ver
 * `LoginPage` para el razonamiento completo (mismo criterio aquí).
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
  useRedirigirSiHaySesion();

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
