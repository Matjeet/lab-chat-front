'use client';

import { useEffect, useState } from 'react';

import Button from '../../atoms/Button';

const ORDEN = ['system', 'light', 'dark'];
const ETIQUETA = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' };

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
      Tema: {ETIQUETA[tema]}
    </Button>
  );
};

export default ThemeToggle;
