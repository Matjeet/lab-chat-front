import { renderHook, waitFor } from '@testing-library/react';

import useCrearSolicitudChat from './useCrearSolicitudChat';
import { observarSesion } from '../firebase/auth';
import { crearSolicitud } from '../conversacion/solicitudes';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

jest.mock('../conversacion/solicitudes');

afterEach(() => {
  jest.clearAllMocks();
});

const usuarioFake = (uid, idToken = 'token-abc') => ({
  uid,
  getIdToken: jest.fn().mockResolvedValue(idToken),
});

describe('useCrearSolicitudChat', () => {
  it('sin sesión, resuelve "no-autenticado" sin llamar al backend', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useCrearSolicitudChat());
    const resultado = await result.current('mateo', 'ana');

    expect(resultado).toEqual({ ok: false, error: { kind: 'no-autenticado' } });
    expect(crearSolicitud).not.toHaveBeenCalled();
  });

  it('con sesión activa, llama a crearSolicitud con el idToken de esa sesión', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    crearSolicitud.mockResolvedValue({
      ok: true,
      data: { id: '1', solicitante: 'mateo', solicitado: 'ana', aceptada: false, creadaEn: '2026-01-01T00:00:00Z', pendiente: true },
    });

    const { result } = renderHook(() => useCrearSolicitudChat());

    // El idToken de la sesión se resuelve async (usuario.getIdToken()), así
    // que las primeras llamadas pueden caer todavía en "no-autenticado" —
    // reintentar hasta que el hook ya lo tenga listo.
    let resultado;
    await waitFor(async () => {
      resultado = await result.current('mateo', 'ana');
      expect(resultado.ok).toBe(true);
    });

    expect(crearSolicitud).toHaveBeenLastCalledWith('mateo', 'ana', 'token-abc');
  });

  it('propaga el resultado tal cual cuando falla', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    crearSolicitud.mockResolvedValue({ ok: false, error: { kind: 'duplicada' } });

    const { result } = renderHook(() => useCrearSolicitudChat());

    let resultado;
    await waitFor(async () => {
      resultado = await result.current('mateo', 'ana');
      expect(crearSolicitud).toHaveBeenCalled();
    });

    expect(resultado).toEqual({ ok: false, error: { kind: 'duplicada' } });
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return cancelar;
    });

    const { unmount } = renderHook(() => useCrearSolicitudChat());
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
