import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegistroForm from './RegistroForm';
import { registrarUsuario } from '../../../api/registro';

jest.mock('../../../api/registro');

const rellenarFormulario = async (user, { username, email, password }) => {
  await user.type(screen.getByLabelText('Nombre de usuario'), username);
  await user.type(screen.getByLabelText('Correo electrónico'), email);
  await user.type(screen.getByLabelText('Contraseña'), password);
};

const DATOS_VALIDOS = {
  username: 'mateo29',
  email: 'Mateo@Example.com',
  password: 'secretpass',
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('RegistroForm', () => {
  it('valida en cliente y no llama a la API si hay campos inválidos', async () => {
    const user = userEvent.setup();
    render(<RegistroForm onRegistroCompleto={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findAllByRole('alert')).toHaveLength(3);
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra los requisitos del usuario al enfocar y los marca al cumplirlos', async () => {
    const user = userEvent.setup();
    render(<RegistroForm onRegistroCompleto={jest.fn()} />);
    const usuario = screen.getByLabelText('Nombre de usuario');

    await user.click(usuario);
    const longitud = screen.getByText('Entre 3 y 50 caracteres').closest('li');
    expect(longitud).toHaveAttribute('data-estado', 'pendiente');

    await user.type(usuario, 'mateo');
    expect(longitud).toHaveAttribute('data-estado', 'cumplido');

    await user.tab();
    expect(screen.queryByText('Entre 3 y 50 caracteres')).not.toBeInTheDocument();
  });

  it('envía los datos normalizados y avisa al completar', async () => {
    const user = userEvent.setup();
    const onRegistroCompleto = jest.fn();
    registrarUsuario.mockResolvedValue({
      ok: true,
      data: { id: 1, username: 'mateo29', email: 'mateo@example.com', activo: true },
    });
    render(<RegistroForm onRegistroCompleto={onRegistroCompleto} />);

    await rellenarFormulario(user, DATOS_VALIDOS);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(onRegistroCompleto).toHaveBeenCalled());
    expect(registrarUsuario).toHaveBeenCalledWith({
      username: 'mateo29',
      email: 'mateo@example.com',
      password: 'secretpass',
    });
  });

  it('muestra un aviso genérico ante un 409 y no marca ningún campo', async () => {
    const user = userEvent.setup();
    registrarUsuario.mockResolvedValue({ ok: false, error: { kind: 'duplicado' } });
    render(<RegistroForm onRegistroCompleto={jest.fn()} />);

    await rellenarFormulario(user, DATOS_VALIDOS);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText(/no se pudo completar el registro/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('marca los campos que el servidor rechaza en un 400', async () => {
    const user = userEvent.setup();
    registrarUsuario.mockResolvedValue({
      ok: false,
      error: { kind: 'validacion', campos: { email: 'x', password: 'y' } },
    });
    render(<RegistroForm onRegistroCompleto={jest.fn()} />);

    await rellenarFormulario(user, DATOS_VALIDOS);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Nombre de usuario')).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('deshabilita el botón mientras se envía', async () => {
    const user = userEvent.setup();
    let resolver;
    registrarUsuario.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );
    const onRegistroCompleto = jest.fn();
    render(<RegistroForm onRegistroCompleto={onRegistroCompleto} />);

    await rellenarFormulario(user, DATOS_VALIDOS);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByRole('button', { name: 'Creando cuenta…' })).toBeDisabled();

    resolver({ ok: true, data: { id: 1 } });
    await waitFor(() => expect(onRegistroCompleto).toHaveBeenCalled());
  });
});
