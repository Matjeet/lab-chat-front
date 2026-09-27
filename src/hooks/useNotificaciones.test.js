import { act, renderHook, waitFor } from '@testing-library/react';

import useNotificaciones from './useNotificaciones';
import { observarSesion } from '../firebase/auth';
import { obtenerNotificaciones, actualizarLeida } from '../notificaciones/notificaciones';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

jest.mock('../notificaciones/notificaciones');

const usuarioFake = (uid, idToken = 'token-abc') => ({
  uid,
  getIdToken: jest.fn().mockResolvedValue(idToken),
});

const paginaFake = (content) => ({
  ok: true,
  data: { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true, empty: content.length === 0 },
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useNotificaciones', () => {
  it('sin "receptor", no consulta el backend', () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });

    renderHook(() => useNotificaciones(''));

    expect(obtenerNotificaciones).not.toHaveBeenCalled();
  });

  it('sin sesión, no consulta el backend aunque "receptor" ya se conozca', () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    renderHook(() => useNotificaciones('mateo'));

    expect(obtenerNotificaciones).not.toHaveBeenCalled();
  });

  it('con "receptor" y sesión activa, carga la primera página', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    const notificaciones = [{ id: 1, remitente: 'ana', tipo: 'solicitud', leida: false, createdAt: '2026-01-01T00:00:00Z' }];
    obtenerNotificaciones.mockResolvedValue(paginaFake(notificaciones));

    const { result } = renderHook(() => useNotificaciones('mateo'));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.notificaciones).toEqual(notificaciones);
    expect(obtenerNotificaciones).toHaveBeenCalledWith('mateo', 'token-abc', { size: 20 });
  });

  it('calcula "noLeidas" a partir de la página cargada', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerNotificaciones.mockResolvedValue(
      paginaFake([
        { id: 1, remitente: 'ana', tipo: 'solicitud', leida: false, createdAt: '2026-01-01T00:00:00Z' },
        { id: 2, remitente: 'luis', tipo: 'solicitud', leida: true, createdAt: '2026-01-01T00:00:00Z' },
        { id: 3, remitente: 'ana', tipo: 'solicitud', leida: false, createdAt: '2026-01-01T00:00:00Z' },
      ]),
    );

    const { result } = renderHook(() => useNotificaciones('mateo'));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.noLeidas).toBe(2);
  });

  it('si el backend falla, expone el error tipado', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerNotificaciones.mockResolvedValue({ ok: false, error: { kind: 'servidor' } });

    const { result } = renderHook(() => useNotificaciones('mateo'));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toEqual({ kind: 'servidor' });
    expect(result.current.notificaciones).toEqual([]);
  });

  it('marcarLeida actualiza el estado local de inmediato y llama a actualizarLeida con el uid', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerNotificaciones.mockResolvedValue(
      paginaFake([{ id: 1, remitente: 'ana', tipo: 'solicitud', leida: false, createdAt: '2026-01-01T00:00:00Z' }]),
    );
    actualizarLeida.mockResolvedValue({ ok: true, data: {} });

    const { result } = renderHook(() => useNotificaciones('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      result.current.marcarLeida(1);
    });

    expect(result.current.notificaciones[0].leida).toBe(true);
    expect(result.current.noLeidas).toBe(0);
    expect(actualizarLeida).toHaveBeenCalledWith(1, 'uid-123', true, 'token-abc');
  });

  it('marcarNoLeida actualiza el estado local a "no leída"', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerNotificaciones.mockResolvedValue(
      paginaFake([{ id: 1, remitente: 'ana', tipo: 'solicitud', leida: true, createdAt: '2026-01-01T00:00:00Z' }]),
    );
    actualizarLeida.mockResolvedValue({ ok: true, data: {} });

    const { result } = renderHook(() => useNotificaciones('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      result.current.marcarNoLeida(1);
    });

    expect(result.current.notificaciones[0].leida).toBe(false);
    expect(actualizarLeida).toHaveBeenCalledWith(1, 'uid-123', false, 'token-abc');
  });

  it('recargar vuelve a pedir la lista', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerNotificaciones.mockResolvedValue(paginaFake([]));

    const { result } = renderHook(() => useNotificaciones('mateo'));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerNotificaciones).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.recargar();
      await Promise.resolve();
    });

    await waitFor(() => expect(obtenerNotificaciones).toHaveBeenCalledTimes(2));
  });
});
