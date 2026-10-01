'use client';

import { useEffect, useRef, useState } from 'react';
import { Blobatar } from '@blobatar/react';
import 'blobatar/motion.css'; // requisito de la propia librería: sin esto, `animate` no anima nada.

import Button from '../../atoms/Button';
import {
  FORMAS,
  EMOCIONES,
  HUE_MIN,
  HUE_MAX,
  TONE_MIN,
  TONE_MAX,
  TONE_STEP,
  PERSONALIZACION_INICIAL,
  opcionesBlobatar,
  etiquetaBlobatar,
} from '../../../utils/avatarBlobatar';
import styles from './AvatarPersonalizable.module.css';

/**
 * Molécula: el avatar del formulario de registro — generado por `blobatar`
 * a partir del nombre de usuario, tal como se va escribiendo, con la opción
 * de personalizarlo.
 *
 * **Automático por defecto**: mientras no se abra el panel de
 * personalización, el avatar es exactamente `<Blobatar name={username} />` —
 * nada de forma/color/emoción fijados, todo lo decide el hash del nombre.
 * El botón de personalizar (icono de ajustes, alineado a la izquierda,
 * arriba del avatar — que sigue centrado — sin fondo ni borde propios: se ve
 * solo el icono, mismo criterio que los botones de icono de
 * `ItemNotificacion`) abre un panel con cuatro controles — forma, color
 * (`hue`), tono (`tone`) y
 * emoción (`expression`) — sembrado con {@link PERSONALIZACION_INICIAL} la
 * primera vez que se abre; a partir de ahí, cualquier cambio en un control
 * reemplaza las cuatro a la vez (no hay una mezcla "estas tres automáticas,
 * esta fijada" — mantiene el modelo simple). "Usar automático", dentro del
 * panel, vuelve a `null` (deja de personalizar) sin cerrar el panel.
 *
 * **Lo que ve la vista previa es exactamente lo que se manda**: cada cambio
 * de `username` o de la personalización llama a `onCambiarAvatar` con el
 * fragmento `<Blobatar .../>` ya serializado (ver
 * `src/utils/avatarBlobatar.js#etiquetaBlobatar`) — el mismo texto que
 * `chat-gateway` persiste tal cual en el campo `avatar` de
 * `POST /api/v1/registro` (contrato §4.1). `RegistroForm` solo necesita
 * guardar ese valor y mandarlo al confirmar el registro. Esto **no** incluye
 * `animate` (ver justo abajo): la animación es un efecto puramente visual
 * de este componente, nunca viaja en la etiqueta guardada.
 *
 * **Animado siempre** (`animate="always"`, pensado para un avatar grande y
 * único como este — no para una lista, donde blobatar recomienda `"hover"`):
 * requiere `import "blobatar/motion.css"` (si no, `animate` no hace nada) y
 * cambia el modo de renderizado de `<img>` a SVG en línea, la única forma en
 * que `:hover`/CSS pueden alcanzar el dibujo. Respeta
 * `prefers-reduced-motion` por su cuenta (se queda estático) y no dispara en
 * touch.
 *
 * @param {object} props
 * @param {string} props.username  Valor actual del campo "Nombre de usuario" (puede estar vacío o ser inválido mientras se escribe).
 * @param {(etiqueta: string) => void} props.onCambiarAvatar
 */
const AvatarPersonalizable = ({ username, onCambiarAvatar }) => {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [personalizacion, setPersonalizacion] = useState(null);
  const contenedorRef = useRef(null);

  const usernameLimpio = username.trim();

  useEffect(() => {
    onCambiarAvatar(etiquetaBlobatar(usernameLimpio, personalizacion ?? {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onCambiarAvatar` es un
    // closure nuevo en cada render de quien nos monta (no está memoizado con
    // useCallback): incluirlo dispararía este efecto en cada render sin que
    // el avatar en sí haya cambiado.
  }, [usernameLimpio, personalizacion]);

  useEffect(() => {
    if (!panelAbierto) return undefined;

    const alClicFuera = (evento) => {
      if (!contenedorRef.current?.contains(evento.target)) setPanelAbierto(false);
    };
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') setPanelAbierto(false);
    };

    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [panelAbierto]);

  const alPulsarPersonalizar = () => {
    if (panelAbierto) {
      setPanelAbierto(false);
      return;
    }
    setPanelAbierto(true);
    setPersonalizacion((previa) => previa ?? PERSONALIZACION_INICIAL);
  };

  const actualizarCampo = (campo, valor) =>
    setPersonalizacion((previa) => ({ ...(previa ?? PERSONALIZACION_INICIAL), [campo]: valor }));

  const valoresPanel = personalizacion ?? PERSONALIZACION_INICIAL;

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <button
        type="button"
        className={styles.botonPersonalizar}
        aria-label="Personalizar avatar"
        aria-haspopup="dialog"
        aria-expanded={panelAbierto}
        onClick={alPulsarPersonalizar}
      >
        <svg
          className={styles.icono}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      </button>

      <div className={styles.avatarEnvoltorio}>
        <Blobatar
          name={usernameLimpio || ' '}
          size={96}
          title={usernameLimpio ? `Avatar de ${usernameLimpio}` : 'Vista previa del avatar'}
          animate="always"
          {...opcionesBlobatar(personalizacion ?? {})}
        />
      </div>

      {panelAbierto && (
        <div className={styles.panel} role="dialog" aria-label="Personalizar avatar">
          <div className={styles.campo}>
            <label htmlFor="avatar-forma">Forma</label>
            <select
              id="avatar-forma"
              value={valoresPanel.shape}
              onChange={(evento) => actualizarCampo('shape', evento.target.value)}
            >
              {FORMAS.map((forma) => (
                <option key={forma.id} value={forma.id}>
                  {forma.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.campo}>
            <label htmlFor="avatar-color">Color</label>
            <input
              id="avatar-color"
              type="range"
              min={HUE_MIN}
              max={HUE_MAX}
              value={valoresPanel.hue}
              onChange={(evento) => actualizarCampo('hue', Number(evento.target.value))}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="avatar-tono">Tono</label>
            <input
              id="avatar-tono"
              type="range"
              min={TONE_MIN}
              max={TONE_MAX}
              step={TONE_STEP}
              value={valoresPanel.tone}
              onChange={(evento) => actualizarCampo('tone', Number(evento.target.value))}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="avatar-emocion">Emoción</label>
            <select
              id="avatar-emocion"
              value={valoresPanel.expression}
              onChange={(evento) => actualizarCampo('expression', evento.target.value)}
            >
              {EMOCIONES.map((emocion) => (
                <option key={emocion.id} value={emocion.id}>
                  {emocion.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            disabled={!personalizacion}
            onClick={() => setPersonalizacion(null)}
          >
            Usar automático
          </Button>
        </div>
      )}
    </div>
  );
};

export default AvatarPersonalizable;
