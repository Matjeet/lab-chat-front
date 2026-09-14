import { renderHook, waitFor } from '@testing-library/react';

import useRedirigirSiHaySesion from './useRedirigirSiHaySesion';
import { observarSesion } from '../firebase/auth';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('useRedirigirSiHaySesion', () => {
  it('con sesión activa, navega a /home y sigue "comprobando" (no hay nada que mostrar)', () => {
    observarSesion.mockImplementation((callback) => {
      callback({ uid: 'abc123' });
      return jest.fn();
    });

    const { result } = renderHook(() => useRedirigirSiHaySesion());

    expect(replace).toHaveBeenCalledWith('/home');
    expect(result.current.comprobando).toBe(true);
  });

  it('sin sesión, deja de comprobar y no navega', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useRedirigirSiHaySesion());

    await waitFor(() => expect(result.current.comprobando).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return cancelar;
    });

    const { unmount } = renderHook(() => useRedirigirSiHaySesion());
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
