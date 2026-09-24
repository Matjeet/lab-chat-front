import { act, renderHook, waitFor } from '@testing-library/react';

import useMiUsuario from './useMiUsuario';
import { observarSesion } from '../firebase/auth';
import { obtenerUsuario } from '../api/usuario';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

jest.mock('../api/usuario');

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

const usuarioFake = (uid, idToken = 'token-abc') => ({
  uid,
  getIdToken: jest.fn().mockResolvedValue(idToken),
});

describe('useMiUsuario', () => {
  it('sin nada guardado y sin sesión, empieza vacío', () => {
    observarSesion.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useMiUsuario());

    expect(result.current.yo).toBe('');
    expect(obtenerUsuario).not.toHaveBeenCalled();
  });

  it('lee lo que ya hubiera en localStorage al montarse', () => {
    localStorage.setItem('chat:miUsuario', 'mateo29');
    observarSesion.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useMiUsuario());

    expect(result.current.yo).toBe('mateo29');
  });

  it('con sesión activa, consulta GET /api/v1/usuarios/{uid} y actualiza "yo"', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerUsuario.mockResolvedValue({
      ok: true,
      data: { username: 'ana', email: 'ana@example.com' },
    });

    const { result } = renderHook(() => useMiUsuario());

    await waitFor(() => expect(result.current.yo).toBe('ana'));
    expect(obtenerUsuario).toHaveBeenCalledWith('uid-123', 'token-abc');
    expect(localStorage.getItem('chat:miUsuario')).toBe('ana');
  });

  it('no consulta el backend si no hay sesión', () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    renderHook(() => useMiUsuario());

    expect(obtenerUsuario).not.toHaveBeenCalled();
  });

  it('si el backend falla, conserva lo que ya hubiera en localStorage', async () => {
    localStorage.setItem('chat:miUsuario', 'previo');
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    obtenerUsuario.mockResolvedValue({ ok: false, error: { kind: 'servidor' } });

    const { result } = renderHook(() => useMiUsuario());

    await waitFor(() => expect(obtenerUsuario).toHaveBeenCalled());
    expect(result.current.yo).toBe('previo');
  });

  it('establecerYo guarda y actualiza "yo" de inmediato', () => {
    observarSesion.mockImplementation(() => jest.fn());
    const { result } = renderHook(() => useMiUsuario());

    act(() => {
      result.current.establecerYo('mateo');
    });

    expect(result.current.yo).toBe('mateo');
    expect(localStorage.getItem('chat:miUsuario')).toBe('mateo');
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return cancelar;
    });

    const { unmount } = renderHook(() => useMiUsuario());
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
