import { renderHook, waitFor } from '@testing-library/react';

import useExisteUsuario from './useExisteUsuario';
import { observarSesion } from '../firebase/auth';
import { existeUsuario } from '../api/usuario';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

jest.mock('../api/usuario');

afterEach(() => {
  jest.clearAllMocks();
});

const usuarioFake = (uid, idToken = 'token-abc') => ({
  uid,
  getIdToken: jest.fn().mockResolvedValue(idToken),
});

describe('useExisteUsuario', () => {
  it('sin sesión, resuelve "no-autenticado" sin llamar al backend', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useExisteUsuario());
    const resultado = await result.current('mateo');

    expect(resultado).toEqual({ ok: false, error: { kind: 'no-autenticado' } });
    expect(existeUsuario).not.toHaveBeenCalled();
  });

  it('con sesión activa, llama a existeUsuario con el idToken de esa sesión', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    existeUsuario.mockResolvedValue({ ok: true, data: { existe: true } });

    const { result } = renderHook(() => useExisteUsuario());

    // El idToken de la sesión se resuelve async (usuario.getIdToken()), así
    // que las primeras llamadas pueden caer todavía en "no-autenticado" —
    // reintentar hasta que el hook ya lo tenga listo.
    let resultado;
    await waitFor(async () => {
      resultado = await result.current('ana');
      expect(resultado.ok).toBe(true);
    });

    expect(resultado).toEqual({ ok: true, data: { existe: true } });
    expect(existeUsuario).toHaveBeenLastCalledWith('ana', 'token-abc');
  });

  it('propaga el resultado tal cual cuando el username no existe', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    existeUsuario.mockResolvedValue({ ok: true, data: { existe: false } });

    const { result } = renderHook(() => useExisteUsuario());

    let resultado;
    await waitFor(async () => {
      resultado = await result.current('fantasma');
      expect(existeUsuario).toHaveBeenCalled();
    });

    expect(resultado).toEqual({ ok: true, data: { existe: false } });
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return cancelar;
    });

    const { unmount } = renderHook(() => useExisteUsuario());
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
