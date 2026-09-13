'use client';

import { useEffect, useState } from 'react';

/**
 * Átomo: muestra una frase elegida al azar de una lista — distinta cada vez
 * que el componente se monta (abrir la página o recargarla).
 *
 * La frase se sortea en un efecto, no durante el render: en export estático
 * el HTML de `<p>` ya viene fijado desde el build, así que si se sorteara
 * en el render, el valor "de build" y el que calcula el navegador al
 * hidratar casi nunca coincidirían (error de hidratación de React). Al
 * sortear después de montar, el primer render (build y cliente) muestra
 * siempre `opciones[0]` — idénticos — y el cambio a la frase al azar ocurre
 * ya en el navegador, sin conflicto.
 *
 * @param {object} props
 * @param {string[]} props.opciones  Frases candidatas (al menos una).
 * @param {string} [props.className]
 */
const TextoAleatorio = ({ opciones, className }) => {
  const [frase, setFrase] = useState(opciones[0]);

  useEffect(() => {
    setFrase(opciones[Math.floor(Math.random() * opciones.length)]);
  }, [opciones]);

  return <p className={className}>{frase}</p>;
};

export default TextoAleatorio;
