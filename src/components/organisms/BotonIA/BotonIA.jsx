'use client';

import { useState } from 'react';

import Button from '../../atoms/Button';
import Modal from '../../molecules/Modal';
import styles from './BotonIA.module.css';

const MENSAJE = 'Función en construcción';

/**
 * Organismo: botón de la cabecera para las funciones de IA (el icono
 * convencional de las "chispas", dos estrellas). La funcionalidad todavía no
 * existe: al pulsarlo abre un `Modal` `tono="warning"` (amarillo) avisando de
 * que está en construcción. Es organismo y no molécula porque lleva su propio
 * `Modal` (una molécula no puede importar otra del mismo nivel).
 */
const BotonIA = () => {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button
        variant="icon"
        aria-label="Funciones de IA"
        aria-haspopup="dialog"
        onClick={() => setAbierto(true)}
      >
        <svg
          className={styles.icono}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.5 3 11 8l5 1.5-5 1.5-1.5 5-1.5-5L3 9.5 8 8l1.5-5Z" />
          <path d="M17.5 12.5 18.5 16l3.5 1-3.5 1-1 3.5-1-3.5-3.5-1 3.5-1 1-3.5Z" />
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

export default BotonIA;
