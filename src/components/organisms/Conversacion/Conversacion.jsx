'use client';

import { useEffect, useRef } from 'react';

import BurbujaMensaje from '../../atoms/BurbujaMensaje';
import Alert from '../../atoms/Alert';
import CampoMensaje from '../../molecules/CampoMensaje';
import styles from './Conversacion.module.css';

/**
 * Organismo: la conversación completa con una persona — lista de mensajes
 * (auto-scroll al último al llegar uno nuevo) + campo para escribir uno.
 *
 * Mientras el WebSocket no está `conectado`, deshabilita el campo en vez de
 * dejar que se mande algo que el servidor descartaría en silencio (contrato
 * chat-conversacion §2.2 — no hay frame de rechazo que avise de eso).
 *
 * @param {object} props
 * @param {string} props.yo    Username del usuario actual (para distinguir mensajes propios).
 * @param {string} props.con   Username de la otra persona (para el encabezado).
 * @param {import('../../../conversacion/historial').Mensaje[]} props.mensajes
 * @param {boolean} props.conectado
 * @param {(contenido: string) => {ok: boolean, error?: {mensaje: string}}} props.onEnviar
 */
const Conversacion = ({ yo, con, mensajes, conectado, onEnviar }) => {
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes.length]);

  return (
    <div className={styles.conversacion}>
      <header className={styles.cabecera}>
        <p className={styles.con}>{con}</p>
        <span className={`${styles.estado} ${conectado ? styles.conectado : ''}`.trim()}>
          {conectado ? 'Conectado' : 'Conectando…'}
        </span>
      </header>

      {!conectado && (
        <Alert tipo="info">
          Sin conexión en tiempo real con el servidor de chat — no se puede mandar ni recibir
          mensajes ahora mismo.
        </Alert>
      )}

      <ul className={styles.mensajes} aria-label={`Conversación con ${con}`}>
        {mensajes.length === 0 && (
          <li className={styles.vacio}>Todavía no hay mensajes. ¡Escribe el primero!</li>
        )}
        {mensajes.map((mensaje) => (
          <BurbujaMensaje
            key={mensaje.id}
            contenido={mensaje.contenido}
            enviadoEn={mensaje.enviadoEn}
            propio={mensaje.remitente === yo}
          />
        ))}
        <li ref={finRef} aria-hidden="true" className={styles.centinela} />
      </ul>

      <CampoMensaje onEnviar={onEnviar} disabled={!conectado} />
    </div>
  );
};

export default Conversacion;
