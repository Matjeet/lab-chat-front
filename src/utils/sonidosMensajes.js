/**
 * Aviso sonoro para mensajes del chat — dos tonos distintos, sintetizados
 * con la Web Audio API (osciladores simples) en vez de archivos de audio
 * que mantener o descargar: uno corto y agudo para un mensaje **propio**
 * confirmado, otro de dos notas ascendentes, más llamativo a propósito,
 * para uno **recibido**. Quien decide cuál tocar es `HomePage`, desde el
 * mismo efecto que ya actualiza `ListaChats` con cada `canal.ultimoMensaje`
 * (ver `useCanalMensajes`) — así también suena un mensaje recibido de un
 * chat que ni siquiera está abierto todavía.
 *
 * Tolerante a fallos, igual que `src/utils/miUsuario.js` con
 * `localStorage`: sin `AudioContext` (navegador viejo, o política de
 * autoplay antes de cualquier gesto del usuario), no hace nada — un aviso
 * puramente decorativo nunca debe romper el envío o la recepción de un
 * mensaje real.
 */

let contextoAudio = null;

const obtenerContexto = () => {
  try {
    const ContextoAudio = window.AudioContext || window.webkitAudioContext;
    if (!ContextoAudio) return null;
    if (!contextoAudio) contextoAudio = new ContextoAudio();
    if (contextoAudio.state === 'suspended') contextoAudio.resume().catch(() => {});
    return contextoAudio;
  } catch {
    return null;
  }
};

/**
 * Un tono con envolvente rápida de ataque/caída (`GainNode`), para evitar el
 * "clic" seco de encender/apagar el oscilador de golpe.
 *
 * @param {AudioContext} contexto
 * @param {{frecuencia: number, inicio?: number, duracion?: number, volumen?: number}} opciones
 */
const reproducirTono = (contexto, { frecuencia, inicio = 0, duracion = 0.12, volumen = 0.15 }) => {
  const oscilador = contexto.createOscillator();
  const ganancia = contexto.createGain();
  oscilador.type = 'sine';
  oscilador.frequency.value = frecuencia;

  const cuando = contexto.currentTime + inicio;
  ganancia.gain.setValueAtTime(0, cuando);
  ganancia.gain.linearRampToValueAtTime(volumen, cuando + 0.01);
  ganancia.gain.linearRampToValueAtTime(0, cuando + duracion);

  oscilador.connect(ganancia);
  ganancia.connect(contexto.destination);
  oscilador.start(cuando);
  oscilador.stop(cuando + duracion + 0.02);
};

/** Mensaje propio confirmado: un blip corto y agudo. */
export const reproducirSonidoEnviado = () => {
  const contexto = obtenerContexto();
  if (!contexto) return;
  try {
    reproducirTono(contexto, { frecuencia: 880 });
  } catch {
    /* decorativo: un fallo aquí no debe propagarse */
  }
};

/** Mensaje recibido: dos notas ascendentes, más llamativo a propósito. */
export const reproducirSonidoRecibido = () => {
  const contexto = obtenerContexto();
  if (!contexto) return;
  try {
    reproducirTono(contexto, { frecuencia: 587, inicio: 0 });
    reproducirTono(contexto, { frecuencia: 784, inicio: 0.1 });
  } catch {
    /* decorativo: un fallo aquí no debe propagarse */
  }
};
