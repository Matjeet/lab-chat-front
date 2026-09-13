import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('valida en cliente antes de avisar', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findAllByRole('alert')).toHaveLength(2);
  });

  it('acepta cualquier contraseña no vacía (sin exigir fortaleza)', async () => {
    const user = userEvent.setup();
    const onIniciarSesion = jest.fn();
    render(<LoginForm onIniciarSesion={onIniciarSesion} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(onIniciarSesion).toHaveBeenCalledWith({
      email: 'mateo@example.com',
      password: 'abc',
    });
  });

  it('normaliza el email (recorta y pasa a minúsculas) antes de entregarlo', async () => {
    const user = userEvent.setup();
    const onIniciarSesion = jest.fn();
    render(<LoginForm onIniciarSesion={onIniciarSesion} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'Mateo@Example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(onIniciarSesion).toHaveBeenCalledWith({
      email: 'mateo@example.com',
      password: 'secreta',
    });
  });

  it('sin onIniciarSesion, avisa de que falta conectar el backend', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByText(/falta conectar el inicio de sesión/i),
    ).toBeInTheDocument();
  });
});
