import { render, screen } from '@testing-library/react';

import StyleGuidePage from './StyleGuidePage';
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
  observarSesion.mockImplementation((callback) => {
    callback({ uid: 'abc123' });
    return jest.fn();
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('StyleGuidePage', () => {
  it('muestra las secciones del sistema de diseño', () => {
    render(<StyleGuidePage />);
    expect(
      screen.getByRole('heading', { name: 'Sistema de diseño' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Colores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Botones' })).toBeInTheDocument();
  });

  it('renderiza las variantes de Button', () => {
    render(<StyleGuidePage />);
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Danger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
