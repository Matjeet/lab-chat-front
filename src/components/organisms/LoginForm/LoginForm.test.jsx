import { render, screen, waitFor } from '@testing-library/react';
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

  it('con éxito (ok: true), no muestra ningún aviso propio', async () => {
    const user = userEvent.setup();
    const onIniciarSesion = jest.fn().mockResolvedValue({ ok: true });
    render(<LoginForm onIniciarSesion={onIniciarSesion} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(onIniciarSesion).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['credenciales', /correo o contraseña incorrectos/i],
    ['demasiados-intentos', /demasiados intentos/i],
    ['red', /no se pudo conectar/i],
    ['desconocido', /hubo un problema al iniciar sesión/i],
  ])('con error.kind "%s", muestra el aviso correspondiente', async (kind, patron) => {
    const user = userEvent.setup();
    const onIniciarSesion = jest.fn().mockResolvedValue({ ok: false, error: { kind } });
    render(<LoginForm onIniciarSesion={onIniciarSesion} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(patron);
  });

  it('deshabilita el botón mientras espera la respuesta', async () => {
    const user = userEvent.setup();
    let resolver;
    const onIniciarSesion = jest.fn(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );
    render(<LoginForm onIniciarSesion={onIniciarSesion} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'mateo@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('button', { name: 'Iniciando sesión…' })).toBeDisabled();

    resolver({ ok: true });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled(),
    );
  });
});
