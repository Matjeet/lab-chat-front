import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HomePage from './HomePage';
import { InterlocutorProvider } from '../../../context/InterlocutorContext';
import { observarSesion } from '../../../firebase/auth';
import useConversacion from '../../../hooks/useConversacion';

// Factory explícita: un automock sin factory cargaría el Firebase real (sin
// las variables de entorno que solo existen en build/dev).
jest.mock('../../../firebase/auth', () => ({
  observarSesion: jest.fn(),
}));

const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

// Se mockea al nivel del hook, no de fetch/WebSocket: HomePage/VistaConversacion
// no necesitan saber cómo se conecta, solo qué hace con lo que el hook expone
// (ver src/hooks/useConversacion.test.js para el hook en sí).
jest.mock('../../../hooks/useConversacion');

beforeEach(() => {
  observarSesion.mockImplementation((callback) => {
    callback({ uid: 'abc123' }); // con sesión: la mayoría de los tests ejercitan la vista
    return jest.fn();
  });
  useConversacion.mockReturnValue({
    mensajes: [],
    cargandoHistorial: false,
    errorHistorial: null,
    conectado: true,
    enviarMensaje: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// InterlocutorContext real (no mockeado): el selector vive en la cabecera y
// HomePage lo lee, así que interactuar con él tal como lo haría quien usa la
// app es más fiel que mockear el hook.
const montar = () =>
  render(
    <InterlocutorProvider>
      <HomePage />
    </InterlocutorProvider>,
  );

const confirmarMiUsuario = async (user, yo = 'mateo') => {
  await user.type(screen.getByLabelText('Tu usuario'), yo);
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
};

const elegirInterlocutor = async (user, con = 'ana') => {
  await user.type(screen.getByLabelText('Chatear con'), con);
  await user.click(screen.getByRole('button', { name: 'Ir' }));
};

describe('HomePage', () => {
  it('el selector de interlocutor está en la cabecera desde el principio', () => {
    montar();
    expect(screen.getByLabelText('Chatear con')).toBeInTheDocument();
  });

  it('pide primero "Tu usuario"', () => {
    montar();
    expect(screen.getByLabelText('Tu usuario')).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('si "Tu usuario" ya se guardó antes (p. ej. al registrarse), no lo vuelve a pedir', () => {
    localStorage.setItem('chat:miUsuario', 'mateo29');
    montar();

    expect(screen.queryByLabelText('Tu usuario')).not.toBeInTheDocument();
    expect(
      screen.getByText(/elige con quién chatear arriba, en la cabecera/i),
    ).toBeInTheDocument();
  });

  it('valida "Tu usuario": un campo vacío no avanza', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/obligatorio/i)).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('con "Tu usuario" guardado pero sin interlocutor, invita a elegirlo en la cabecera', async () => {
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user);

    expect(
      screen.getByText(/elige con quién chatear arriba, en la cabecera/i),
    ).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('no deja chatear contigo mismo', async () => {
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user, 'mateo');
    await elegirInterlocutor(user, 'mateo');

    expect(
      await screen.findByText('No puedes chatear contigo mismo. Elige otro usuario en la cabecera.'),
    ).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('con "yo" confirmado y un interlocutor válido elegido en la cabecera, conecta la conversación', async () => {
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user, 'mateo');
    await elegirInterlocutor(user, 'ana');

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(localStorage.getItem('chat:miUsuario')).toBe('mateo');
  });

  it('cambiar el interlocutor desde la cabecera cambia la conversación abierta', async () => {
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user, 'mateo');
    await elegirInterlocutor(user, 'ana');
    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });

    await user.clear(screen.getByLabelText('Chatear con'));
    await elegirInterlocutor(user, 'luis');

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'luis' });
  });

  it('mientras carga el historial, avisa en vez de mostrar la conversación vacía', async () => {
    useConversacion.mockReturnValue({
      mensajes: [],
      cargandoHistorial: true,
      errorHistorial: null,
      conectado: false,
      enviarMensaje: jest.fn(),
    });
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user);
    await elegirInterlocutor(user);

    expect(screen.getByText(/cargando conversación/i)).toBeInTheDocument();
  });

  it('si falla el historial, avisa del error', async () => {
    useConversacion.mockReturnValue({
      mensajes: [],
      cargandoHistorial: false,
      errorHistorial: { kind: 'red' },
      conectado: false,
      enviarMensaje: jest.fn(),
    });
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user);
    await elegirInterlocutor(user);

    expect(screen.getByText(/no se pudo cargar el historial/i)).toBeInTheDocument();
  });

  it('sin sesión, navega a /login en segundo plano (sin bloquear el formulario)', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    montar();

    expect(screen.getByLabelText('Tu usuario')).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });
});
