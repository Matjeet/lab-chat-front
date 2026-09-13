import { render, screen } from '@testing-library/react';

import Page from './page';

// Mismo motivo que en LoginPage.test.jsx: factory explícita para no cargar
// el Firebase real (sin las variables de entorno de build/dev) ni requerir
// un App Router de verdad para next/navigation.
jest.mock('../src/firebase/auth', () => ({
  iniciarSesion: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Ruta /', () => {
  it('arranca en el formulario de inicio de sesión', () => {
    render(<Page />);
    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('invita a crear una cuenta si no se tiene', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
  });
});
