'use client';

import { useState } from 'react';

import Button from '../../atoms/Button';
import Modal from '../../molecules/Modal';
import styles from './BotonRuleta.module.css';

const MENSAJE = 'Función en construcción';

/**
 * Organismo: botón de la cabecera con el icono de una ruleta, junto a la marca.
 * La funcionalidad todavía no existe: al pulsarlo abre un `Modal`
 * `tono="warning"` (amarillo) avisando de que está en construcción. Es
 * organismo y no molécula porque lleva su propio `Modal` (una molécula no puede
 * importar otra del mismo nivel).
 */
const BotonRuleta = () => {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button
        variant="icon"
        aria-label="Ruleta"
        aria-haspopup="dialog"
        onClick={() => setAbierto(true)}
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
          {/* Ruleta: borde, anillo de casillas, cubo central con cuatro radios y la bola (un trazo de largo casi cero con punta redonda). */}
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="1.5" />
          <path d="M13.06 10.94 16.24 7.76M10.94 10.94 7.76 7.76M13.06 13.06 16.24 16.24M10.94 13.06 7.76 16.24" />
          <path d="M18.93 8h.01" />
        </svg>
      </Button>
      {abierto && (
        <Modal
          tono="warning"
          mensaje={MENSAJE}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
};

export default BotonRuleta;
