'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import DefaultLayout from '../../templates/DefaultLayout';
import RegistroForm from '../../organisms/RegistroForm';
import Alert from '../../atoms/Alert';
import { iniciarSesion } from '../../../firebase/auth';
import useRedirigirSiHaySesion from '../../../hooks/useRedirigirSiHaySesion';
import { guardarMiUsuario } from '../../../utils/miUsuario';
import {
  descartarBienvenidaPendiente,
  marcarBienvenidaPendiente,
} from '../../../utils/bienvenida';
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
 * `chat-registro` con el Admin SDK, ver `src/api/registro.js`), así que al
 * completarse con éxito esta página inicia sesión de inmediato con el email
 * y la contraseña recién usados (`iniciarSesion`, la misma función del
 * login) y navega a `/home` — sin pasar por una pantalla de confirmación ni
 * por `/login`. Solo si ese inicio de sesión falla (la cuenta ya existe, no
 * se deshace nada) cae a la confirmación de siempre, con los datos que
 * devuelve el servidor (nunca la contraseña) y un enlace a `/login`.
 *
 * Antes de iniciar sesión deja marcada una bienvenida pendiente
 * (`src/utils/bienvenida.js`) que `HomePage` muestra una sola vez; si el
 * inicio de sesión falla, la desmarca para que no aparezca en un login
 * posterior que no tenga que ver con el alta.
 *
 * Además recuerda el `username` en este navegador (`guardarMiUsuario`) como
 * respaldo para `HomePage`, por si luego no se pudiera resolver desde el
 * backend (ver `docs/integracion-conversacion.md`).
 */
const RegistroPage = () => {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  useRedirigirSiHaySesion();

  const alCompletarRegistro = async (datos, credenciales) => {
    guardarMiUsuario(datos.username);
    // Se marca antes de iniciar sesión, no después: `useRedirigirSiHaySesion`
    // puede navegar a `/home` en cuanto Firebase publica la sesión, antes de
    // que `iniciarSesion` resuelva — `HomePage` ya tiene que encontrarla.
    marcarBienvenidaPendiente();
    const sesion = await iniciarSesion(credenciales);
    if (sesion.ok) {
      router.replace('/home');
      return;
    }
    descartarBienvenidaPendiente();
    // La cuenta ya existe: si el inicio de sesión automático falla, se
    // muestra la confirmación de siempre para que la persona lo haga a mano.
    setUsuario(datos);
  };

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
          <RegistroForm onRegistroCompleto={alCompletarRegistro} />
        </>
      )}
    </DefaultLayout>
  );
};

export default RegistroPage;
