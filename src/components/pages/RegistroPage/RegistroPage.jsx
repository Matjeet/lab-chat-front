'use client';

import { useState } from 'react';
import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import RegistroForm from '../../organisms/RegistroForm';
import Alert from '../../atoms/Alert';
import styles from './RegistroPage.module.css';

/**
 * Página: alta de usuario.
 * Mientras no hay alta muestra el formulario; al completarse, la confirmación
 * con los datos que devuelve el servidor (nunca la contraseña).
 */
const RegistroPage = () => {
  const [usuario, setUsuario] = useState(null);

  return (
    <DefaultLayout title="Crear cuenta" centered>
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
