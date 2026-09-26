import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectorInterlocutor from './SelectorInterlocutor';
import { InterlocutorProvider, useInterlocutor } from '../../../context/InterlocutorContext';
import useExisteUsuario from '../../../hooks/useExisteUsuario';
import useCrearSolicitudChat from '../../../hooks/useCrearSolicitudChat';

// Se mockea al nivel del hook, no de fetch/Firebase: SelectorInterlocutor no
// necesita saber cómo se comprueba si el usuario existe ni cómo se crea la
// solicitud, solo qué hace con el resultado — ver
// src/hooks/useExisteUsuario.test.js y src/hooks/useCrearSolicitudChat.test.js
// para los hooks en sí. Factory explícita: un automock sin factory cargaría
// el hook real, que importa firebase/auth (sin las variables de entorno que
// solo existen en build/dev).
jest.mock('../../../hooks/useExisteUsuario', () => jest.fn());
jest.mock('../../../hooks/useCrearSolicitudChat', () => jest.fn());

// Sonda para leer, en el propio test, lo que quedó en el contexto — sin esto
// no hay forma de observar `establecerCon` desde fuera. Ya no la escribe el
// envío del formulario (ver más abajo), pero `ListaChats` sigue haciéndolo
// en la app real; la sonda confirma que este componente no la toca.
const SondaCon = () => {
  const { con } = useInterlocutor();
  return <p>con actual: {con || '(vacío)'}</p>;
};

const montar = (yo = 'mateo') =>
  render(
    <InterlocutorProvider>
      <SelectorInterlocutor yo={yo} />
      <SondaCon />
    </InterlocutorProvider>,
  );

let comprobarUsuario;
let crearSolicitud;

beforeEach(() => {
  comprobarUsuario = jest.fn().mockResolvedValue({ ok: true, data: { existe: true } });
  crearSolicitud = jest.fn().mockResolvedValue({
    ok: true,
    data: { id: '1', solicitante: 'mateo', solicitado: 'ana', aceptada: false, creadaEn: '2026-01-01T00:00:00Z', pendiente: true },
  });
  useExisteUsuario.mockReturnValue(comprobarUsuario);
  useCrearSolicitudChat.mockReturnValue(crearSolicitud);
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

  it('si el usuario existe, manda la solicitud con "yo" como solicitante y avisa del envío', async () => {
    const user = userEvent.setup();
    montar('mateo');

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const aviso = await screen.findByRole('alertdialog', { name: 'Solicitud enviada' });
    expect(aviso).toHaveTextContent('Solicitud enviada a ana. El chat empezará en cuanto la acepte.');
    expect(comprobarUsuario).toHaveBeenCalledWith('ana');
    expect(crearSolicitud).toHaveBeenCalledWith('mateo', 'ana');
  });

  it('resalta en negrilla el usuario y "acepte" en el aviso de éxito, en tono info (azul, no error)', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const aviso = await screen.findByRole('alertdialog', { name: 'Solicitud enviada' });
    const negrillas = aviso.querySelectorAll('strong');
    expect(negrillas).toHaveLength(2);
    expect(negrillas[0]).toHaveTextContent('ana');
    expect(negrillas[1]).toHaveTextContent('acepte');
    // El botón de confirmación es "primary" (tono info), no "danger" — no es un error.
    expect(screen.getByRole('button', { name: 'Entendido' })).toHaveClass('primary');
  });

  it('tras enviar la solicitud, no abre el chat directamente (no escribe en el contexto)', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    await screen.findByRole('alertdialog', { name: 'Solicitud enviada' });
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('tras enviar la solicitud, limpia el campo', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    await screen.findByRole('alertdialog', { name: 'Solicitud enviada' });
    expect(screen.getByLabelText('Chatear con')).toHaveValue('');
  });

  it('cierra el aviso de éxito al pulsar Entendido', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    expect(await screen.findByRole('alertdialog', { name: 'Solicitud enviada' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
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

  it('si el usuario no existe, muestra un modal de error y no llega a mandar la solicitud', async () => {
    comprobarUsuario.mockResolvedValue({ ok: true, data: { existe: false } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'fantasma');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const modal = await screen.findByRole('alertdialog', { name: 'Usuario no encontrado' });
    expect(modal).toHaveTextContent(/no existe ningún usuario/i);
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
    expect(crearSolicitud).not.toHaveBeenCalled();
  });

  it('si falla la comprobación de existencia (red, servidor...), muestra un modal y no manda la solicitud', async () => {
    comprobarUsuario.mockResolvedValue({ ok: false, error: { kind: 'red' } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const modal = await screen.findByRole('alertdialog', { name: 'No se pudo comprobar' });
    expect(modal).toHaveTextContent(/no se pudo comprobar el usuario/i);
    expect(crearSolicitud).not.toHaveBeenCalled();
  });

  it('si ya existe una solicitud pendiente con ese usuario, muestra un modal específico', async () => {
    crearSolicitud.mockResolvedValue({ ok: false, error: { kind: 'duplicada' } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const modal = await screen.findByRole('alertdialog', { name: 'Ya tienes una solicitud pendiente' });
    expect(modal).toHaveTextContent(/ya existe una solicitud de chat pendiente con este usuario/i);
  });

  it('si la solicitud es hacia uno mismo (validación del backend), muestra un error de campo', async () => {
    crearSolicitud.mockResolvedValue({
      ok: false,
      error: { kind: 'validacion', mensaje: 'solicitante y solicitado no pueden ser el mismo usuario' },
    });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'mateo');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'solicitante y solicitado no pueden ser el mismo usuario',
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('si falla el envío de la solicitud por otro motivo, muestra un modal genérico', async () => {
    crearSolicitud.mockResolvedValue({ ok: false, error: { kind: 'servidor' } });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    const modal = await screen.findByRole('alertdialog', { name: 'No se pudo enviar la solicitud' });
    expect(modal).toHaveTextContent(/no se pudo enviar la solicitud de chat/i);
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

  it('limpia el aviso de éxito al volver a escribir', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    expect(await screen.findByRole('alertdialog', { name: 'Solicitud enviada' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Chatear con'), 'x');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('el aviso de éxito desaparece solo, pasado un tiempo (sin esperar a que lo cierren)', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    expect(await screen.findByRole('alertdialog', { name: 'Solicitud enviada' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    jest.useRealTimers();
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

  it('deshabilita el campo y el botón mientras se manda la solicitud', async () => {
    let resolverSolicitud;
    crearSolicitud.mockReturnValue(
      new Promise((resolve) => {
        resolverSolicitud = resolve;
      }),
    );
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    await waitFor(() => expect(crearSolicitud).toHaveBeenCalled());
    expect(screen.getByLabelText('Chatear con')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ir' })).toBeDisabled();

    resolverSolicitud({
      ok: true,
      data: { id: '1', solicitante: 'mateo', solicitado: 'ana', aceptada: false, creadaEn: '2026-01-01T00:00:00Z', pendiente: true },
    });
    await waitFor(() => expect(screen.getByLabelText('Chatear con')).not.toBeDisabled());
  });
});
