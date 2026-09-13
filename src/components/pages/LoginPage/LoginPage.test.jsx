import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from './LoginPage';
import { iniciarSesion, observarSesion } from '../../../firebase/auth';

// Factory explícita: un automock sin factory necesita cargar el módulo real
// para conocer su forma, y eso ejecutaría src/firebase/config.js (Firebase
// real) sin las variables de entorno que solo existen en build/dev.
jest.mock('../../../firebase/auth', () => ({
  iniciarSesion: jest.fn(),
  observarSesion: jest.fn(),
}));

const push = jest.fn();
const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

const FRASES_INTRO = [
  'Un chat simple para hablar con tus amigos y conocidos.',
  'Habla con quien quieras, cuando quieras.',
  'Tu gente, siempre a un mensaje de distancia.',
  'Conversaciones sin complicaciones, con la gente que ya conoces.',
  'Un lugar para seguir la conversación con tus amigos.',
];

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
});

describe('LoginPage', () => {
  it('muestra una de las frases de bienvenida al azar', () => {
    render(<LoginPage />);
    expect(
      screen.getByText((contenido) => FRASES_INTRO.includes(contenido)),
    ).toBeInTheDocument();
  });

  it('muestra el formulario de inicio de sesión', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('ofrece un enlace para crear una cuenta', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
  });

  it('con login correcto, llama a Firebase y navega a /home', async () => {
    const user = userEvent.setup();
    iniciarSesion.mockResolvedValue({
      ok: true,
      data: { uid: 'abc123', email: 'mateo@example.com', idToken: 'token-de-prueba' },
    });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/home'));
    expect(iniciarSesion).toHaveBeenCalledWith({
      email: 'mateo@example.com',
      password: 'Passw0rd!',
    });
  });

  it('con credenciales inválidas, no navega y deja que LoginForm muestre el aviso', async () => {
    const user = userEvent.setup();
    iniciarSesion.mockResolvedValue({ ok: false, error: { kind: 'credenciales' } });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByText(/correo o contraseña incorrectos/i),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('con una sesión de Firebase ya activa, navega a /home en vez de mostrar el formulario', async () => {
    observarSesion.mockImplementation((callback) => {
      callback({ uid: 'abc123', email: 'mateo@example.com' });
      return jest.fn();
    });

    render(<LoginPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/home'));
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
    // router.replace, no push: no debe quedar en el historial una pantalla
    // de login que nunca llegó a usarse.
    expect(push).not.toHaveBeenCalled();
  });

  it('mientras comprueba la sesión, no muestra el formulario', () => {
    observarSesion.mockImplementation(() => jest.fn()); // nunca llama al callback
    render(<LoginPage />);

    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
    expect(screen.getByText('Comprobando sesión…')).toBeInTheDocument();
  });

  it('cancela la suscripción a observarSesion al desmontarse', () => {
    const cancelar = jest.fn();
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return cancelar;
    });

    const { unmount } = render(<LoginPage />);
    unmount();

    expect(cancelar).toHaveBeenCalled();
  });
});
