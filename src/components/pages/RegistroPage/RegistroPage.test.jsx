import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegistroPage from './RegistroPage';
import { registrarUsuario } from '../../../api/registro';
import { observarSesion } from '../../../firebase/auth';

jest.mock('../../../api/registro');

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../../../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  // Por defecto, como si no hubiera sesión: la mayoría de los tests
  // ejercitan el formulario, no la comprobación de sesión en sí.
  observarSesion.mockImplementation((callback) => {
    callback(null);
    return jest.fn();
  });
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('RegistroPage', () => {
  it('muestra el formulario de registro', () => {
    render(<RegistroPage />);
    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
  });

  it('cambia a la confirmación tras un alta correcta', async () => {
    const user = userEvent.setup();
    registrarUsuario.mockResolvedValue({
      ok: true,
      data: {
        id: 7,
        username: 'mateo29',
        email: 'mateo@example.com',
        activo: true,
      },
    });
    render(<RegistroPage />);

    await user.type(screen.getByLabelText('Nombre de usuario'), 'mateo29');
    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText(/cuenta creada correctamente/i),
    ).toBeInTheDocument();
    expect(screen.getByText('mateo@example.com')).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/',
    );
    // Para que HomePage no tenga que volver a pedir el username (ver
    // src/utils/miUsuario.js).
    expect(localStorage.getItem('chat:miUsuario')).toBe('mateo29');
  });

  it('muestra el formulario de inmediato aunque la comprobación de sesión no haya resuelto', () => {
    observarSesion.mockImplementation(() => jest.fn()); // nunca llama al callback
    render(<RegistroPage />);

    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
  });

  it('con una sesión de Firebase ya activa, navega a /home en segundo plano', async () => {
    observarSesion.mockImplementation((callback) => {
      callback({ uid: 'abc123', email: 'mateo@example.com' });
      return jest.fn();
    });

    render(<RegistroPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/home'));
  });
});
