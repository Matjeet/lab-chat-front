import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HomePage from './HomePage';

describe('HomePage', () => {
  it('saluda con el nombre tras enviar el formulario', async () => {
    render(<HomePage />);

    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Hola, Ada 👋')).toBeInTheDocument();
  });

  it('pide el nombre si el campo está vacío', async () => {
    render(<HomePage />);

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Escribe tu nombre para continuar')).toBeInTheDocument();
  });

  it('enlaza a registro y a login', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
