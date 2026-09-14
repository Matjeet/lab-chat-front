import DefaultLayout from '../DefaultLayout';
import Alert from '../../atoms/Alert';

/**
 * Plantilla: pantalla de espera mientras se confirma la sesión de Firebase
 * (`observarSesion` / `useRequiereSesion`, siempre asíncronos — nunca se
 * sabe de forma síncrona al cargar la página si hay sesión o no).
 *
 * La usan `LoginPage`, `RegistroPage` y `HomePage` con el **mismo aspecto
 * exacto** a propósito: si dos de ellas navegan de una a otra mientras
 * todavía están comprobando (p. ej. `/` → `/home` cuando ya hay sesión), el
 * contenido en pantalla no cambia en la transición — solo la ruta por
 * debajo — así que no se percibe como un parpadeo. Cambiar este componente
 * (texto, layout) afecta a las tres por igual; si una necesita verse
 * distinta, ya no cumple su propósito y no debería usarla.
 */
const CargandoSesion = () => (
  <DefaultLayout title="Chat" centered>
    <Alert tipo="info">Comprobando sesión…</Alert>
  </DefaultLayout>
);

export default CargandoSesion;
