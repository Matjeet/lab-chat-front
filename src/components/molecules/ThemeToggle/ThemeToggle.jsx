'use client';

import { useEffect, useState } from 'react';

import Button from '../../atoms/Button';
import styles from './ThemeToggle.module.css';

const ORDEN = ['system', 'light', 'dark'];
const ETIQUETA = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' };
// Símbolos de texto (no emoji): heredan el color del botón vía currentColor,
// así se ven bien en cualquier tema/variant. Un emoji a color no lo haría.
const SIMBOLO = { system: '◐', light: '☀', dark: '☾' };

/** Aplica el tema al elemento <html>. "system" = sin atributo (decide el SO). */
const aplicarTema = (tema) => {
  const root = document.documentElement;
  if (tema === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = tema;
  }
};

/** Lee el tema persistido de forma tolerante a fallos (modo incógnito, etc.). */
const leerTemaGuardado = () => {
  try {
    const valor = localStorage.getItem('theme');
    return ORDEN.includes(valor) ? valor : 'system';
  } catch {
    return 'system';
  }
};

/**
 * Molécula: interruptor de tema. Cicla sistema → claro → oscuro y lo persiste.
 * Se muestra como símbolo, no texto; el `aria-label` del botón lleva la
 * etiqueta completa para quien use lector de pantalla.
 * El valor persistido lo re-aplica el script de `app/layout.jsx` en la carga
 * siguiente para evitar el parpadeo.
 */
const ThemeToggle = () => {
  const [tema, setTema] = useState('system');

  useEffect(() => {
    setTema(leerTemaGuardado());
  }, []);

  const cambiar = () => {
    const siguiente = ORDEN[(ORDEN.indexOf(tema) + 1) % ORDEN.length];
    setTema(siguiente);
    aplicarTema(siguiente);
    try {
      if (siguiente === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', siguiente);
      }
    } catch {
      /* almacenamiento no disponible: el cambio dura solo esta sesión */
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={cambiar}
      aria-label={`Cambiar tema. Actual: ${ETIQUETA[tema]}`}
    >
      <span className={styles.icono} aria-hidden="true">
        {SIMBOLO[tema]}
      </span>
    </Button>
  );
};

export default ThemeToggle;
