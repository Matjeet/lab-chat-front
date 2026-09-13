import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import LoginForm from '../../organisms/LoginForm';
import styles from './LoginPage.module.css';

/**
 * Página: inicio de sesión.
 * Sin estado propio: `LoginForm` es quien maneja los campos y la validación.
 * Todavía no hay servicio de autenticación conectado (ver `LoginForm`).
 */
const LoginPage = () => (
  <DefaultLayout title="Iniciar sesión" centered tarjeta>
    <p className={styles.intro}>Inicia sesión para continuar.</p>
    <LoginForm />
    <p className={styles.registro}>
      ¿Aún no tienes cuenta?{' '}
      <Link href="/registro" className={styles.enlace}>
        Crear una cuenta
      </Link>
    </p>
  </DefaultLayout>
);

export default LoginPage;
