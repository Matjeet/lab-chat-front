'use client';

import { useEffect, useRef, useState } from 'react';

import Button from '../../atoms/Button';
import Modal from '../../molecules/Modal';
import ItemNotificacion from '../../atoms/ItemNotificacion';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import useNotificaciones from '../../../hooks/useNotificaciones';
import useActualizarSolicitud from '../../../hooks/useActualizarSolicitud';
import styles from './Notificaciones.module.css';

const INSIGNIA_MAXIMA = 9;
const TITULO_ERROR_ACEPTAR = 'No se pudo confirmar la aceptación';
const MENSAJE_ERROR_ACEPTAR =
  'El chat ya se abrió, pero no se pudo confirmar la aceptación de la solicitud en el servidor. Inténtalo de nuevo.';
const TITULO_ERROR_RECHAZAR = 'No se pudo rechazar la solicitud';
const MENSAJE_ERROR_RECHAZAR = 'No se pudo rechazar la solicitud. Inténtalo de nuevo.';
const MENSAJE_SOLICITUD_NO_ENCONTRADA =
  'Esta solicitud ya no está disponible — puede que ya se haya resuelto.';
const TITULO_SOLICITUD_RECHAZADA = 'Solicitud rechazada';
const MENSAJE_SOLICITUD_RECHAZADA = 'La solicitud fue rechazada exitosamente.';
const RETRASO_RECARGA_RECHAZO_MS = 500;

/**
 * Organismo: campana de notificaciones de la cabecera. Al pulsarla abre un
 * desplegable típico — no un `Modal`: no bloquea el resto de la pantalla (sin
 * fondo oscurecido) y no navega a ninguna página nueva. Se cierra con un clic
 * fuera, con Escape, o volviendo a pulsar la campana; cada vez que se abre,
 * recarga la lista (`recargar`, de `useNotificaciones`) para no mostrar datos
 * viejos si algo llegó mientras estaba cerrado.
 *
 * El cuerpo del panel tiene una altura máxima con scroll propio
 * (`.panelCuerpo`) para no crecer indefinidamente con muchas notificaciones.
 *
 * La campana muestra una insignia con `noLeidas` (más de `INSIGNIA_MAXIMA` se
 * ve como "9+") — ver `useNotificaciones` para su cálculo (aproximado: solo
 * cuenta la página cargada, el backend no expone un total de no leídas).
 *
 * Cada notificación de tipo `"solicitud"` pendiente trae dos botones
 * (`ItemNotificacion`): aceptar (verde) y rechazar (rojo). Ambos llaman a
 * `useActualizarSolicitud` (`PATCH /api/v1/conversaciones/solicitudes`,
 * `solicitante` = quien la envió — `notificacion.remitente` —, `solicitado`
 * = `yo`, `aceptada` = `true`/`false` según el botón):
 * - **Aceptar**: abre la conversación de inmediato con quien la envió
 *   (`InterlocutorContext#establecerCon`, el mismo mecanismo que ya usa
 *   `ListaChats`) **en paralelo** con la llamada al backend — no espera su
 *   respuesta para abrir el chat, son dos cosas independientes. También
 *   marca la notificación como leída y cierra el panel de inmediato. Si la
 *   llamada al backend falla en segundo plano, un `Modal` de error avisa
 *   (el chat ya abierto no se deshace).
 * - **Rechazar**: espera la respuesta del backend antes de hacer nada más
 *   (no hay ningún chat que abrir). Si sale bien, marca la notificación
 *   como leída, muestra un `Modal` `tono="info"` confirmando el rechazo, y
 *   además vuelve a pedir la lista (`recargar`) medio segundo después —
 *   solo en este caso — para darle tiempo a la actualización a propagarse
 *   (chat-conversacion → RabbitMQ → chat-notificaciones) y reflejar el
 *   `meta` ya resuelto sin esperar a que se cierre y abra el panel; si
 *   falla, un `Modal` `tono="error"`.
 * Mientras cualquiera de las dos llamadas está en vuelo, los botones de esa
 * notificación (`ItemNotificacion` → `deshabilitado`) se desactivan, para
 * evitar un doble envío.
 *
 * @param {object} props
 * @param {string} [props.yo='']  username autenticado, dueño de la bandeja de
 *   notificaciones que se va a pedir. Sin él (p. ej. la instancia de
 *   demostración en `StyleGuidePage`) el panel se queda vacío — aceptable
 *   ahí, no es una pantalla funcional.
 */
const Notificaciones = ({ yo = '' }) => {
  const [abierto, setAbierto] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [modalAviso, setModalAviso] = useState(null);
  const contenedorRef = useRef(null);
  const { establecerCon } = useInterlocutor();
  const { notificaciones, cargando, error, noLeidas, recargar, marcarLeida, marcarNoLeida } =
    useNotificaciones(yo);
  const actualizarSolicitud = useActualizarSolicitud();

  useEffect(() => {
    if (abierto) recargar();
    // `recargar` es estable (useCallback sin dependencias): solo se declara
    // `abierto` porque es lo único que debe disparar la recarga.
  }, [abierto, recargar]);

  useEffect(() => {
    if (!abierto) return undefined;

    const alClicFuera = (evento) => {
      if (!contenedorRef.current?.contains(evento.target)) {
        setAbierto(false);
      }
    };
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const alAceptar = (notificacion) => {
    // "En paralelo": abrir el chat no espera la respuesta del backend — son
    // dos acciones independientes, no una cadena secuencial.
    establecerCon(notificacion.remitente);
    marcarLeida(notificacion.id);
    setAbierto(false);
    setProcesandoId(notificacion.id);
    actualizarSolicitud(notificacion.remitente, yo, true).then((resultado) => {
      setProcesandoId(null);
      if (!resultado.ok) {
        setModalAviso({
          tono: 'error',
          titulo: TITULO_ERROR_ACEPTAR,
          mensaje:
            resultado.error.kind === 'no-encontrado' ? MENSAJE_SOLICITUD_NO_ENCONTRADA : MENSAJE_ERROR_ACEPTAR,
        });
      }
    });
  };

  const alRechazar = (notificacion) => {
    setProcesandoId(notificacion.id);
    actualizarSolicitud(notificacion.remitente, yo, false).then((resultado) => {
      setProcesandoId(null);
      if (resultado.ok) {
        marcarLeida(notificacion.id);
        setModalAviso({
          tono: 'info',
          titulo: TITULO_SOLICITUD_RECHAZADA,
          mensaje: MENSAJE_SOLICITUD_RECHAZADA,
        });
        // Le da tiempo al backend a propagar el rechazo (chat-conversacion →
        // RabbitMQ → chat-notificaciones) antes de volver a pedir la lista,
        // para que la notificación ya venga con el `meta` actualizado.
        setTimeout(recargar, RETRASO_RECARGA_RECHAZO_MS);
      } else {
        setModalAviso({
          tono: 'error',
          titulo: TITULO_ERROR_RECHAZAR,
          mensaje:
            resultado.error.kind === 'no-encontrado' ? MENSAJE_SOLICITUD_NO_ENCONTRADA : MENSAJE_ERROR_RECHAZAR,
        });
      }
    });
  };

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <Button
        variant="ghost"
        aria-label="Notificaciones"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <svg
          className={styles.icono}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <>
            <span className={styles.insignia} aria-hidden="true">
              {noLeidas > INSIGNIA_MAXIMA ? `${INSIGNIA_MAXIMA}+` : noLeidas}
            </span>
            <span className="sr-only">{noLeidas} notificaciones sin leer</span>
          </>
        )}
      </Button>
      {abierto && (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.panelCabecera}>
            <h2 className={styles.panelTitulo}>Notificaciones</h2>
          </div>
          <div className={styles.panelCuerpo}>
            {cargando && <p className={styles.estado}>Cargando…</p>}
            {!cargando && error && (
              <p className={styles.estado}>No se pudieron cargar las notificaciones.</p>
            )}
            {!cargando && !error && notificaciones.length === 0 && (
              <p className={styles.vacio}>No tienes notificaciones por ahora.</p>
            )}
            {!cargando && !error && notificaciones.length > 0 && (
              <ul className={styles.lista} aria-label="Lista de notificaciones">
                {notificaciones.map((notificacion) => (
                  <ItemNotificacion
                    key={notificacion.id}
                    notificacion={notificacion}
                    deshabilitado={procesandoId === notificacion.id}
                    onMarcarLeida={() => marcarLeida(notificacion.id)}
                    onMarcarNoLeida={() => marcarNoLeida(notificacion.id)}
                    onAceptar={() => alAceptar(notificacion)}
                    onRechazar={() => alRechazar(notificacion)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {modalAviso && (
        <Modal
          tono={modalAviso.tono}
          titulo={modalAviso.titulo}
          mensaje={modalAviso.mensaje}
          onCerrar={() => setModalAviso(null)}
        />
      )}
    </div>
  );
};

export default Notificaciones;
