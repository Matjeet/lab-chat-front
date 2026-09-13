import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegistroPage from './RegistroPage';
import { registrarUsuario } from '../../../api/registro';

jest.mock('../../../api/registro');

afterEach(() => {
  jest.clearAllMocks();
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
  });
});
