import { renderHook, waitFor } from '@testing-library/react';

import useRequiereSesion from './useRequiereSesion';
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

describe('useRequiereSesion', () => {
  it('sin sesión, navega a /login y sigue "verificando" (no hay nada que mostrar)', () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useRequiereSesion());

    expect(replace).toHaveBeenCalledWith('/login');
    expect(result.current.verificando).toBe(true);
  });

  it('con sesión activa, deja de verificar y no navega', async () => {
    observarSesion.mockImplementation((callback) => {
      callback({ uid: 'abc123' });
      return jest.fn();
    });

    const { result } = renderHook(() => useRequiereSesion());

    await waitFor(() => expect(result.current.verificando).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback({ uid: 'abc123' });
      return cancelar;
    });

    const { unmount } = renderHook(() => useRequiereSesion());
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
