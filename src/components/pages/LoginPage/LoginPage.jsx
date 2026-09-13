import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import TextoAleatorio from '../../atoms/TextoAleatorio';
import LoginForm from '../../organisms/LoginForm';
import styles from './LoginPage.module.css';

// Una distinta cada vez que se abre o recarga la página (ver TextoAleatorio).
// Recuerdan de qué va la app, no piden iniciar sesión — para eso ya está el
// formulario debajo.
const FRASES_INTRO = [
  'Un chat simple para hablar con tus amigos y conocidos.',
  'Habla con quien quieras, cuando quieras.',
  'Tu gente, siempre a un mensaje de distancia.',
  'Conversaciones sin complicaciones, con la gente que ya conoces.',
  'Un lugar para seguir la conversación con tus amigos.',
];

/**
 * Página: inicio de sesión.
 * Sin estado propio: `LoginForm` maneja los campos y la validación,
 * `TextoAleatorio` el sorteo de la frase de bienvenida. Todavía no hay
 * servicio de autenticación conectado (ver `LoginForm`).
 */
const LoginPage = () => (
  <DefaultLayout title="Iniciar sesión" centered tarjeta>
    <TextoAleatorio opciones={FRASES_INTRO} className={styles.intro} />
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
