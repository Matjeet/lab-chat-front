'use client';

import { useEffect, useRef } from 'react';

import Alert from '../../atoms/Alert';
import ItemChat from '../../atoms/ItemChat';
import styles from './ListaChats.module.css';

/**
 * Organismo: la lista de chats del usuario, a la izquierda de `/home` —
 * con quién ha hablado y el último mensaje de cada conversación, más
 * reciente primero. Scroll infinito: un centinela al final de la lista
 * (mismo patrón que el auto-scroll de `Conversacion`, pero con
 * `IntersectionObserver` en vez de `scrollIntoView`, porque aquí lo que
 * importa es detectar cuándo se hace visible, no forzar el scroll) dispara
 * `onCargarMas` al acercarse al final — solo mientras `hasMore` sea `true`.
 *
 * @param {object} props
 * @param {import('../../../conversacion/listaChats').ChatResumen[]} props.chats
 * @param {boolean} props.cargando        Carga inicial.
 * @param {boolean} props.cargandoMas     Cargando la siguiente página (scroll infinito).
 * @param {{kind: string}|null} props.error
 * @param {boolean} props.hasMore
 * @param {string} props.chatActivo       `otroUsuario` del chat abierto actualmente, si hay uno.
 * @param {() => void} props.onCargarMas
 * @param {(otroUsuario: string) => void} props.onSeleccionar
 */
const ListaChats = ({
  chats,
  cargando,
  cargandoMas,
  error,
  hasMore,
  chatActivo,
  onCargarMas,
  onSeleccionar,
}) => {
  const centinelaRef = useRef(null);

  useEffect(() => {
    if (!hasMore) return undefined;
    const nodo = centinelaRef.current;
    if (!nodo) return undefined;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) onCargarMas();
      },
      { rootMargin: '200px' },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [hasMore, onCargarMas]);

  return (
    <div className={styles.lista}>
      <h2 className={styles.titulo}>Chats</h2>

      {cargando && <Alert tipo="info">Cargando chats…</Alert>}

      {!cargando && error && (
        <Alert tipo="error">
          No se pudo cargar la lista de chats. Revisa tu conexión e inténtalo de nuevo.
        </Alert>
      )}

      {!cargando && !error && chats.length === 0 && (
        <p className={styles.vacio}>
          Todavía no tienes chats. Escribe un usuario arriba para empezar uno.
        </p>
      )}

      {!cargando && !error && chats.length > 0 && (
        <ul className={styles.items} aria-label="Lista de chats">
          {chats.map((chat) => (
            <ItemChat
              key={chat.otroUsuario}
              otroUsuario={chat.otroUsuario}
              ultimoMensaje={chat.ultimoMensaje}
              activo={chat.otroUsuario === chatActivo}
              onClick={() => onSeleccionar(chat.otroUsuario)}
            />
          ))}
          {hasMore && <li ref={centinelaRef} aria-hidden="true" className={styles.centinela} />}
        </ul>
      )}

      {cargandoMas && <Alert tipo="info">Cargando más…</Alert>}
    </div>
  );
};

export default ListaChats;
