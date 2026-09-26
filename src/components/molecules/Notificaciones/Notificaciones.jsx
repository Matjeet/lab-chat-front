'use client';

import { useEffect, useRef, useState } from 'react';

import Button from '../../atoms/Button';
import styles from './Notificaciones.module.css';

/**
 * Molécula: campana de notificaciones de la cabecera. Por ahora es solo la
 * UI — el endpoint que alimentará el panel todavía se está construyendo, así
 * que el cuerpo muestra un estado vacío fijo; cuando ese endpoint exista,
 * sustituye ese estado vacío por la lista real, sin tocar el resto del
 * componente (la campana, el abrir/cerrar, el cierre por clic fuera/Escape).
 *
 * Es un desplegable típico, no un `Modal`: no bloquea el resto de la
 * pantalla (sin fondo oscurecido) y no navega a ninguna página nueva. Se
 * cierra con un clic fuera, con Escape, o volviendo a pulsar la campana.
 */
const Notificaciones = () => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

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
      </Button>
      {abierto && (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.panelCabecera}>
            <h2 className={styles.panelTitulo}>Notificaciones</h2>
          </div>
          <div className={styles.panelCuerpo}>
            <p className={styles.vacio}>No tienes notificaciones por ahora.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
