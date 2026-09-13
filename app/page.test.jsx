import { render, screen } from '@testing-library/react';

import Page from './page';

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
