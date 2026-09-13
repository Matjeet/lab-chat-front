'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import Alert from '../../atoms/Alert';
import TextoAleatorio from '../../atoms/TextoAleatorio';
import LoginForm from '../../organisms/LoginForm';
import { iniciarSesion, observarSesion } from '../../../firebase/auth';
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
 * Antes de mostrar el formulario, comprueba si ya hay una sesión de Firebase
 * activa (`observarSesion`, persistida por el propio SDK en el navegador) —
 * si la hay, no tiene sentido pedir credenciales de nuevo: navega a `/home`
 * directamente. Mientras se resuelve esa comprobación (siempre asíncrona,
 * nunca se sabe de forma síncrona al cargar la página) no se pinta el
 * formulario, para no mostrarlo un instante de más a quien ya tiene sesión.
 * Es el mismo mecanismo que `useRequiereSesion` usa en sentido contrario
 * para las pantallas que sí exigen sesión (`HomePage`, `StyleGuidePage`).
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
  const [comprobandoSesion, setComprobandoSesion] = useState(true);

  useEffect(() => {
    const cancelar = observarSesion((usuario) => {
      if (usuario) {
        router.replace('/home');
        return;
      }
      setComprobandoSesion(false);
    });
    return cancelar;
  }, [router]);

  const alIniciarSesion = async (datos) => {
    const resultado = await iniciarSesion(datos);
    if (resultado.ok) {
      router.push('/home');
    }
    return resultado;
  };

  if (comprobandoSesion) {
    return (
      <DefaultLayout title="Iniciar sesión" centered tarjeta>
        <Alert tipo="info">Comprobando sesión…</Alert>
      </DefaultLayout>
    );
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
