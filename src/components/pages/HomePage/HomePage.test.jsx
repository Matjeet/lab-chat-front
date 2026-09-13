import { render, screen, waitFor } from '@testing-library/react';

import HomePage from './HomePage';
import { observarSesion } from '../../../firebase/auth';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../../../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('HomePage', () => {
  it('con sesión activa, confirma que se inició correctamente', async () => {
    observarSesion.mockImplementation((callback) => {
      callback({ uid: 'abc123' });
      return jest.fn();
    });

    render(<HomePage />);

    expect(
      await screen.findByText('¡Sesión iniciada correctamente!'),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('sin sesión, no muestra el mensaje y navega a /login', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<HomePage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(
      screen.queryByText('¡Sesión iniciada correctamente!'),
    ).not.toBeInTheDocument();
  });
});
