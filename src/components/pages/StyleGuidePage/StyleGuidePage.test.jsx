import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StyleGuidePage from './StyleGuidePage';
import { InterlocutorProvider } from '../../../context/InterlocutorContext';
import { observarSesion } from '../../../firebase/auth';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../../../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

beforeEach(() => {
  // Como si hubiera sesión activa: estos tests ejercitan el contenido de la
  // guía, no la comprobación de sesión en sí (ver useRequiereSesion.test.js).
  // getIdToken: SelectorInterlocutor (en la cabecera) usa useExisteUsuario
  // por debajo, que lo pide al montarse — sin él, ese hook revienta aquí
  // aunque ningún test de esta página llegue a enviar el formulario.
  observarSesion.mockImplementation((callback) => {
    callback({ uid: 'abc123', getIdToken: jest.fn().mockResolvedValue('token-fake') });
    return jest.fn();
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// StyleGuidePage pasa SelectorInterlocutor como headerActions (ver DefaultLayout),
// que necesita InterlocutorContext para montarse.
const montar = () =>
  render(
    <InterlocutorProvider>
      <StyleGuidePage />
    </InterlocutorProvider>,
  );

describe('StyleGuidePage', () => {
  it('muestra las secciones del sistema de diseño', () => {
    montar();
    expect(
      screen.getByRole('heading', { name: 'Sistema de diseño' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Colores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Botones' })).toBeInTheDocument();
  });

  it('renderiza las variantes de Button', () => {
    montar();
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Danger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('muestra el selector de interlocutor en la cabecera', () => {
    montar();
    expect(screen.getByLabelText('Chatear con')).toBeInTheDocument();
  });

  it('simula y cierra el modal de error desde la guía viva', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Simular error bloqueante' }));
    const modal = screen.getByRole('alertdialog', { name: 'Usuario no encontrado' });
    expect(modal).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('muestra el contenido de inmediato aunque la comprobación de sesión no haya resuelto', () => {
    observarSesion.mockImplementation(() => jest.fn()); // nunca llama al callback
    montar();

    expect(
      screen.getByRole('heading', { name: 'Sistema de diseño' }),
    ).toBeInTheDocument();
  });
});
