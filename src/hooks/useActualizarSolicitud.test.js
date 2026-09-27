import { renderHook, waitFor } from '@testing-library/react';

import useActualizarSolicitud from './useActualizarSolicitud';
import { observarSesion } from '../firebase/auth';
import { actualizarSolicitud } from '../conversacion/solicitudes';

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

describe('useActualizarSolicitud', () => {
  it('sin sesión, resuelve "no-autenticado" sin llamar al backend', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useActualizarSolicitud());
    const resultado = await result.current('mateo', 'ana', true);

    expect(resultado).toEqual({ ok: false, error: { kind: 'no-autenticado' } });
    expect(actualizarSolicitud).not.toHaveBeenCalled();
  });

  it('con sesión activa, llama a actualizarSolicitud con el idToken de esa sesión', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    actualizarSolicitud.mockResolvedValue({
      ok: true,
      data: {
        id: '1',
        solicitante: 'mateo',
        solicitado: 'ana',
        aceptada: true,
        creadaEn: '2026-01-01T00:00:00Z',
        pendiente: false,
      },
    });

    const { result } = renderHook(() => useActualizarSolicitud());

    // El idToken de la sesión se resuelve async (usuario.getIdToken()), así
    // que las primeras llamadas pueden caer todavía en "no-autenticado" —
    // reintentar hasta que el hook ya lo tenga listo.
    let resultado;
    await waitFor(async () => {
      resultado = await result.current('mateo', 'ana', true);
      expect(resultado.ok).toBe(true);
    });

    expect(actualizarSolicitud).toHaveBeenLastCalledWith('mateo', 'ana', true, 'token-abc');
  });

  it('propaga el resultado tal cual cuando falla', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(usuarioFake('uid-123'));
      return jest.fn();
    });
    actualizarSolicitud.mockResolvedValue({ ok: false, error: { kind: 'no-encontrado' } });

    const { result } = renderHook(() => useActualizarSolicitud());

    let resultado;
    await waitFor(async () => {
      resultado = await result.current('mateo', 'ana', false);
      expect(actualizarSolicitud).toHaveBeenCalled();
    });

    expect(resultado).toEqual({ ok: false, error: { kind: 'no-encontrado' } });
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return cancelar;
    });

    const { unmount } = renderHook(() => useActualizarSolicitud());
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
