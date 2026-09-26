'use client';

import { useEffect, useRef, useState } from 'react';

import Button from '../../atoms/Button';
import ItemNotificacion from '../../atoms/ItemNotificacion';
import { useInterlocutor } from '../../../context/InterlocutorContext';
import useNotificaciones from '../../../hooks/useNotificaciones';
import styles from './Notificaciones.module.css';

const INSIGNIA_MAXIMA = 9;

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
 * Cada notificación de tipo `"solicitud"` trae dos botones (`ItemNotificacion`):
 * aceptar (verde) y rechazar (rojo). Ninguno de los dos consume todavía un
 * servicio de aceptar/rechazar — no existe (`chat-conversacion` no lo
 * implementa aún, ver `CLAUDE.md`) — así que, por ahora:
 * - **Aceptar** hace lo único que sí existe: abre la conversación de
 *   inmediato con quien la envió (`InterlocutorContext#establecerCon`, el
 *   mismo mecanismo que ya usa `ListaChats`), marca la notificación como
 *   leída y cierra el panel.
 * - **Rechazar** solo marca la notificación como leída (no hay nada más que
 *   hacer sin un endpoint de verdad) — un placeholder deliberado, a
 *   sustituir en cuanto ese servicio exista.
 *
 * @param {object} props
 * @param {string} [props.yo='']  username autenticado, dueño de la bandeja de
 *   notificaciones que se va a pedir. Sin él (p. ej. la instancia de
 *   demostración en `StyleGuidePage`) el panel se queda vacío — aceptable
 *   ahí, no es una pantalla funcional.
 */
const Notificaciones = ({ yo = '' }) => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const { establecerCon } = useInterlocutor();
  const { notificaciones, cargando, error, noLeidas, recargar, marcarLeida, marcarNoLeida } =
    useNotificaciones(yo);

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
    establecerCon(notificacion.remitente);
    marcarLeida(notificacion.id);
    setAbierto(false);
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
                    onMarcarLeida={() => marcarLeida(notificacion.id)}
                    onMarcarNoLeida={() => marcarNoLeida(notificacion.id)}
                    onAceptar={() => alAceptar(notificacion)}
                    onRechazar={() => marcarLeida(notificacion.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
