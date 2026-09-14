'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import CargandoSesion from '../../templates/CargandoSesion';
import TextoAleatorio from '../../atoms/TextoAleatorio';
import LoginForm from '../../organisms/LoginForm';
import { iniciarSesion } from '../../../firebase/auth';
import useRedirigirSiHaySesion from '../../../hooks/useRedirigirSiHaySesion';
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
 *
 * Antes de mostrar el formulario, `useRedirigirSiHaySesion` comprueba si ya
 * hay sesión de Firebase activa — si la hay, no tiene sentido pedir
 * credenciales de nuevo: navega a `/home` directamente. Mientras se resuelve
 * esa comprobación se ve `CargandoSesion`, con el mismo aspecto exacto que
 * `HomePage` muestra en la suya — así, si termina navegando a `/home`, la
 * transición no se percibe como un parpadeo (el contenido en pantalla no
 * cambia, solo la ruta por debajo). Ver `CargandoSesion` para el porqué.
 *
 * `LoginForm` maneja los campos y la validación; esta página solo decide
 * qué pasa con el resultado de `iniciarSesion` (Firebase Authentication):
 * si sale bien, navega a `/home` — si no, `LoginForm` ya muestra el aviso
 * a partir del `error.kind` que le llega en el resultado tipado. Todavía
 * no hay nada que hacer con el `idToken` frente a chat-registro (ver
 * `src/firebase/auth.js`); eso es un paso aparte.
 */
const LoginPage = () => {
  const router = useRouter();
  const { comprobando } = useRedirigirSiHaySesion();

  const alIniciarSesion = async (datos) => {
    const resultado = await iniciarSesion(datos);
    if (resultado.ok) {
      router.push('/home');
    }
    return resultado;
  };

  if (comprobando) {
    return <CargandoSesion />;
  }

  return (
    <DefaultLayout title="Iniciar sesión" centered tarjeta>
      <TextoAleatorio opciones={FRASES_INTRO} className={styles.intro} />
      <LoginForm onIniciarSesion={alIniciarSesion} />
      <p className={styles.registro}>
        ¿Aún no tienes cuenta?{' '}
        <Link href="/registro" className={styles.enlace}>
          Crear una cuenta
        </Link>
      </p>
    </DefaultLayout>
  );
};

export default LoginPage;
