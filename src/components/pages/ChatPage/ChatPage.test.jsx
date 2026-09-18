import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatPage from './ChatPage';
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

// Se mockea al nivel del hook, no de fetch/WebSocket: ChatPage/VistaConversacion
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

const identificarse = async (user, { yo = 'mateo', con = 'ana' } = {}) => {
  await user.type(screen.getByLabelText('Tu usuario'), yo);
  await user.type(screen.getByLabelText('Chatear con'), con);
  await user.click(screen.getByRole('button', { name: 'Entrar al chat' }));
};

describe('ChatPage', () => {
  it('pide primero la identidad (tu usuario / con quién chatear)', () => {
    render(<ChatPage />);
    expect(screen.getByLabelText('Tu usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Chatear con')).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('precarga "Tu usuario" si ya se guardó antes (p. ej. al registrarse)', () => {
    localStorage.setItem('chat:miUsuario', 'mateo29');
    render(<ChatPage />);
    expect(screen.getByLabelText('Tu usuario')).toHaveValue('mateo29');
  });

  it('valida antes de entrar: campos vacíos no avanzan a la conversación', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'Entrar al chat' }));

    expect(await screen.findAllByText(/obligatorio/i)).toHaveLength(2);
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('no deja chatear contigo mismo', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await identificarse(user, { yo: 'mateo', con: 'mateo' });

    expect(await screen.findByText('No puedes chatear contigo mismo.')).toBeInTheDocument();
  });

  it('con identidad válida, conecta la conversación y recuerda "yo"', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await identificarse(user, { yo: 'mateo', con: 'ana' });

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(localStorage.getItem('chat:miUsuario')).toBe('mateo');
  });

  it('"Cambiar interlocutor" vuelve al formulario de identidad', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    await identificarse(user);

    await user.click(screen.getByRole('button', { name: /cambiar interlocutor/i }));

    expect(screen.getByLabelText('Chatear con')).toBeInTheDocument();
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
    render(<ChatPage />);

    await identificarse(user);

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
    render(<ChatPage />);

    await identificarse(user);

    expect(screen.getByText(/no se pudo cargar el historial/i)).toBeInTheDocument();
  });

  it('sin sesión, navega a /login en segundo plano (sin bloquear el formulario)', async () => {
    observarSesion.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<ChatPage />);

    expect(screen.getByLabelText('Tu usuario')).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });
});
