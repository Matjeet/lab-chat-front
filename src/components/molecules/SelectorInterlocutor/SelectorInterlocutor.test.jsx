import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectorInterlocutor from './SelectorInterlocutor';
import { InterlocutorProvider, useInterlocutor } from '../../../context/InterlocutorContext';
import useExisteUsuario from '../../../hooks/useExisteUsuario';

// Se mockea al nivel del hook, no de fetch/Firebase: SelectorInterlocutor no
// necesita saber cómo se comprueba si el usuario existe, solo qué hace con
// el resultado — ver src/hooks/useExisteUsuario.test.js para el hook en sí.
// Factory explícita: un automock sin factory cargaría el hook real, que
// importa firebase/auth (sin las variables de entorno que solo existen en
// build/dev).
jest.mock('../../../hooks/useExisteUsuario', () => jest.fn());

// Sonda para leer, en el propio test, lo que quedó en el contexto tras enviar
// el formulario — sin esto no hay forma de observar `establecerCon` desde fuera.
const SondaCon = () => {
  const { con } = useInterlocutor();
  return <p>con actual: {con || '(vacío)'}</p>;
};

const montar = () =>
  render(
    <InterlocutorProvider>
      <SelectorInterlocutor />
      <SondaCon />
    </InterlocutorProvider>,
  );

let comprobarUsuario;

beforeEach(() => {
  comprobarUsuario = jest.fn().mockResolvedValue({ ok: true, data: { existe: true } });
  useExisteUsuario.mockReturnValue(comprobarUsuario);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SelectorInterlocutor', () => {
  it('empieza vacío si no hay interlocutor elegido', () => {
    montar();
    expect(screen.getByLabelText('Chatear con')).toHaveValue('');
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('confirma en el contexto un username con formato válido que sí existe', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    await waitFor(() => expect(screen.getByText('con actual: ana')).toBeInTheDocument());
    expect(comprobarUsuario).toHaveBeenCalledWith('ana');
  });

  it('no confirma un username con formato inválido (ni llega a comprobar si existe)', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'a');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/entre 3 y 50/i);
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
    expect(comprobarUsuario).not.toHaveBeenCalled();
  });

  it('si el usuario no existe, muestra un modal de error y no lo confirma en el contexto', async () => {
    comprobarUsuario.mockResolvedValue({ ok: true, data: { existe: false } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'fantasma');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const modal = await screen.findByRole('alertdialog', { name: 'Usuario no encontrado' });
    expect(modal).toHaveTextContent(/no existe ningún usuario/i);
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('si falla la comprobación (red, servidor...), muestra un modal de error y no lo confirma', async () => {
    comprobarUsuario.mockResolvedValue({ ok: false, error: { kind: 'red' } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const modal = await screen.findByRole('alertdialog', { name: 'No se pudo comprobar' });
    expect(modal).toHaveTextContent(/no se pudo comprobar el usuario/i);
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('cierra el modal de error al pulsar Entendido, y deja escribir de nuevo', async () => {
    comprobarUsuario.mockResolvedValue({ ok: true, data: { existe: false } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'fantasma');
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Chatear con'), 'x');
    expect(screen.getByLabelText('Chatear con')).toHaveValue('fantasmax');
  });

  it('limpia el error de campo (formato inválido) al volver a escribir', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'a');
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Chatear con'), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('deshabilita el campo y el botón mientras comprueba si el usuario existe', async () => {
    let resolverComprobacion;
    comprobarUsuario.mockReturnValue(
      new Promise((resolve) => {
        resolverComprobacion = resolve;
      }),
    );
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    expect(screen.getByLabelText('Chatear con')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ir' })).toBeDisabled();

    resolverComprobacion({ ok: true, data: { existe: true } });
    await waitFor(() => expect(screen.getByLabelText('Chatear con')).not.toBeDisabled());
  });
});
