'use client';

import { createContext, useContext, useState } from 'react';

const InterlocutorContext = createContext(null);

/**
 * Contexto: con quién se está chateando ahora mismo (`con`). Lo escribe
 * `SelectorInterlocutor` (en la cabecera, solo visible en pantallas que
 * exigen sesión) y lo lee `HomePage` para decidir qué conversación abrir —
 * sin este contexto, ambos tendrían que vivir en el mismo componente.
 *
 * A propósito **no persiste** (ni `localStorage` ni entre recargas): no hay
 * lista de contactos todavía, es solo la conversación activa de esta sesión
 * de navegación (ver `docs/integracion-conversacion.md`).
 */
export const InterlocutorProvider = ({ children }) => {
  const [con, setCon] = useState('');

  return (
    <InterlocutorContext.Provider value={{ con, establecerCon: setCon }}>
      {children}
    </InterlocutorContext.Provider>
  );
};

/** @returns {{con: string, establecerCon: (usuario: string) => void}} */
export const useInterlocutor = () => {
  const contexto = useContext(InterlocutorContext);
  if (!contexto) {
    throw new Error('useInterlocutor debe usarse dentro de <InterlocutorProvider>.');
  }
  return contexto;
};
