import { act, renderHook, waitFor } from '@testing-library/react';

import useListaChats from './useListaChats';
import { observarSesion } from '../firebase/auth';
import { obtenerListaChats } from '../conversacion/listaChats';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

jest.mock('../conversacion/listaChats');

const usuarioFake = (uid, idToken = 'token-abc') => ({
  uid,
  getIdToken: jest.fn().mockResolvedValue(idToken),
});

const paginaFake = (chats, { nextCursor = '', hasMore = false } = {}) => ({
  ok: true,
  data: { content: chats, nextCursor, hasMore },
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useListaChats', () => {
  it('sin "yo", no consulta el backend', () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });

    renderHook(() => useListaChats(''));

    expect(obtenerListaChats).not.toHaveBeenCalled();
  });

  it('sin sesión, no consulta el backend aunque "yo" ya se conozca', () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    renderHook(() => useListaChats('mateo'));

    expect(obtenerListaChats).not.toHaveBeenCalled();
  });

  it('con "yo" y sesión activa, carga la primera página', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    const chats = [{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }];
    obtenerListaChats.mockResolvedValue(paginaFake(chats));

    const { result } = renderHook(() => useListaChats('mateo'));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.chats).toEqual(chats);
    expect(obtenerListaChats).toHaveBeenCalledWith('mateo', 'token-abc', { size: 20 });
  });

  it('si el backend falla, expone el error tipado', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerListaChats.mockResolvedValue({ ok: false, error: { kind: 'servidor' } });

    const { result } = renderHook(() => useListaChats('mateo'));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toEqual({ kind: 'servidor' });
    expect(result.current.chats).toEqual([]);
  });

  it('cargarMas pide la siguiente página con el cursor recibido y la añade al final', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    const primerChat = { otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } };
    const segundoChat = { otroUsuario: 'luis', ultimoMensaje: { contenido: 'Ey' } };
    obtenerListaChats.mockResolvedValueOnce(paginaFake([primerChat], { nextCursor: 'c1', hasMore: true }));

    const { result } = renderHook(() => useListaChats('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.hasMore).toBe(true);

    obtenerListaChats.mockResolvedValueOnce(paginaFake([segundoChat]));
    await act(async () => {
      result.current.cargarMas();
      // Deja correr la promesa mockeada (y sus setState) dentro de act(),
      // no después: si no, React avisa de actualizaciones sin envolver.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(obtenerListaChats).toHaveBeenLastCalledWith('mateo', 'token-abc', {
      cursor: 'c1',
      size: 20,
    });
    expect(result.current.chats).toEqual([primerChat, segundoChat]);
    expect(result.current.hasMore).toBe(false);
  });

  it('cargarMas no hace nada si no hay más páginas', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerListaChats.mockResolvedValue(paginaFake([]));

    const { result } = renderHook(() => useListaChats('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      result.current.cargarMas();
    });

    expect(obtenerListaChats).toHaveBeenCalledTimes(1);
  });

  it('registrarMensajeEnviado mueve (o crea) el chat al principio de la lista', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    const conAna = { otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } };
    const conLuis = { otroUsuario: 'luis', ultimoMensaje: { contenido: 'Ey' } };
    obtenerListaChats.mockResolvedValue(paginaFake([conAna, conLuis]));

    const { result } = renderHook(() => useListaChats('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    const mensajeNuevo = { id: '99', remitente: 'mateo', destinatario: 'luis', contenido: 'Nuevo!' };
    act(() => {
      result.current.registrarMensajeEnviado('luis', mensajeNuevo);
    });

    expect(result.current.chats).toEqual([
      { otroUsuario: 'luis', ultimoMensaje: mensajeNuevo },
      conAna,
    ]);
  });

  it('registrarMensajeEnviado con un usuario nuevo lo agrega como primer chat', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerListaChats.mockResolvedValue(paginaFake([]));

    const { result } = renderHook(() => useListaChats('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    const mensajeNuevo = { id: '1', remitente: 'mateo', destinatario: 'ana', contenido: 'Hola!' };
    act(() => {
      result.current.registrarMensajeEnviado('ana', mensajeNuevo);
    });

    expect(result.current.chats).toEqual([{ otroUsuario: 'ana', ultimoMensaje: mensajeNuevo }]);
  });
});
