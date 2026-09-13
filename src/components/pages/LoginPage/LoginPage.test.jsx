import { render, screen } from '@testing-library/react';

import LoginPage from './LoginPage';

describe('LoginPage', () => {
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
});
