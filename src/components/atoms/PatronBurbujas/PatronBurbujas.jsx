import { useId } from 'react';

import styles from './PatronBurbujas.module.css';

/**
 * Átomo: fondo decorativo con un patrón de burbujas de chat en bucle infinito.
 *
 * Es un `<pattern>` de SVG con 4 iconos de burbuja distintos (rellenos con
 * `var(--color-border)`, así se adapta solo al tema), pintado sobre un SVG
 * de sobra de tamaño (`inset` negativo) al que se anima el `transform` en CSS
 * exactamente una repetición del mosaico — por eso el bucle no se nota.
 *
 * La animación es un placeholder deliberado ("de momento cualquiera, luego
 * decidimos"): cambiarla es tocar solo `@keyframes deriva-burbujas` en
 * `PatronBurbujas.module.css`, no esta ilustración.
 *
 * Puramente decorativo -> aria-hidden. Se anula con `prefers-reduced-motion`.
 */
const PatronBurbujas = () => {
  const id = useId();
  const patternId = `patron-burbujas-${id}`;

  return (
    <svg className={styles.patron} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id={patternId}
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          {/* Burbuja 1: rectángulo redondeado con cola */}
          <g transform="translate(14,18)" fill="var(--color-border)">
            <rect width="52" height="36" rx="12" />
            <path d="M12 36 L12 47 L24 36 Z" />
          </g>

          {/* Burbuja 2: óvalo con cola, girada */}
          <g transform="translate(112,140) rotate(-10)" fill="var(--color-border)">
            <ellipse cx="22" cy="16" rx="24" ry="16" />
            <path d="M38 27 L49 37 L34 30 Z" />
          </g>

          {/* Burbuja 3: "escribiendo…", tres puntos recortados en el fondo */}
          <g transform="translate(128,26) rotate(7)">
            <g fill="var(--color-border)">
              <rect width="48" height="32" rx="16" />
              <path d="M10 32 L10 43 L21 32 Z" />
            </g>
            <circle cx="13" cy="16" r="3.2" fill="var(--color-bg)" />
            <circle cx="24" cy="16" r="3.2" fill="var(--color-bg)" />
            <circle cx="35" cy="16" r="3.2" fill="var(--color-bg)" />
          </g>

          {/* Burbuja 4: nube de pensamiento */}
          <g transform="translate(24,128)" fill="var(--color-border)">
            <circle cx="14" cy="30" r="7" />
            <circle cx="26" cy="18" r="10" />
            <circle cx="42" cy="14" r="8" />
            <circle cx="5" cy="44" r="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

export default PatronBurbujas;
