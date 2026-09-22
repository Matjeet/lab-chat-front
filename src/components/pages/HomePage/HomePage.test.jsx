import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HomePage from './HomePage';
import { InterlocutorProvider } from '../../../context/InterlocutorContext';
import { observarSesion } from '../../../firebase/auth';
import useConversacion from '../../../hooks/useConversacion';
import useMiUsuario from '../../../hooks/useMiUsuario';
import useListaChats from '../../../hooks/useListaChats';

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
// Mismo criterio: HomePage no necesita saber cómo se resuelve "tu usuario"
// (localStorage, el backend...), solo qué hace con {yo, establecerYo} — ver
// src/hooks/useMiUsuario.test.js para el hook en sí.
jest.mock('../../../hooks/useMiUsuario');
// Mismo criterio: HomePage no necesita saber cómo se pide/pagina la lista de
// chats, solo qué hace con lo que el hook expone — ver
// src/hooks/useListaChats.test.js para el hook en sí.
jest.mock('../../../hooks/useListaChats');

const establecerYo = jest.fn();
const registrarMensajeEnviado = jest.fn();
const cargarMasChats = jest.fn();

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
    reintentarHistorial: jest.fn(),
  });
  useMiUsuario.mockReturnValue({ yo: '', establecerYo });
  useListaChats.mockReturnValue({
    chats: [],
    cargando: false,
    cargandoMas: false,
    error: null,
    hasMore: false,
    cargarMas: cargarMasChats,
    registrarMensajeEnviado,
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

  it('sin "yo" resuelto, pide "Tu usuario" como respaldo', () => {
    montar();
    expect(screen.getByLabelText('Tu usuario')).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('si "yo" ya se resolvió (localStorage o el backend), no pide el formulario', () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo29', establecerYo });
    montar();

    expect(screen.queryByLabelText('Tu usuario')).not.toBeInTheDocument();
    expect(
      screen.getByText(/elige un chat de la izquierda, o escribe un usuario arriba/i),
    ).toBeInTheDocument();
  });

  it('valida "Tu usuario": un campo vacío no avanza', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/obligatorio/i)).toBeInTheDocument();
    expect(establecerYo).not.toHaveBeenCalled();
  });

  it('confirmar "Tu usuario" llama a establecerYo con el valor recortado', async () => {
    const user = userEvent.setup();
    montar();

    await confirmarMiUsuario(user, 'mateo');

    expect(establecerYo).toHaveBeenCalledWith('mateo');
  });

  it('con "yo" resuelto pero sin interlocutor, invita a elegirlo en la cabecera', () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    montar();

    expect(
      screen.getByText(/elige un chat de la izquierda, o escribe un usuario arriba/i),
    ).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('no deja chatear contigo mismo', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user, 'mateo');

    expect(
      await screen.findByText('No puedes chatear contigo mismo. Elige otro usuario en la cabecera.'),
    ).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('con "yo" resuelto y un interlocutor válido elegido en la cabecera, conecta la conversación', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user, 'ana');

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });
    expect(screen.getByText('ana')).toBeInTheDocument();
  });

  it('cambiar el interlocutor desde la cabecera cambia la conversación abierta', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user, 'ana');
    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });

    await user.clear(screen.getByLabelText('Chatear con'));
    await elegirInterlocutor(user, 'luis');

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'luis' });
  });

  it('mientras carga el historial, avisa en vez de mostrar la conversación vacía', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    useConversacion.mockReturnValue({
      mensajes: [],
      cargandoHistorial: true,
      errorHistorial: null,
      conectado: false,
      enviarMensaje: jest.fn(),
      reintentarHistorial: jest.fn(),
    });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user);

    expect(screen.getByText(/cargando conversación/i)).toBeInTheDocument();
  });

  it('si falla el historial, avisa del error y ofrece un botón para reintentar', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    const reintentarHistorial = jest.fn();
    useConversacion.mockReturnValue({
      mensajes: [],
      cargandoHistorial: false,
      errorHistorial: { kind: 'red' },
      conectado: false,
      enviarMensaje: jest.fn(),
      reintentarHistorial,
    });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user);

    expect(screen.getByText(/no se pudo cargar el historial/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(reintentarHistorial).toHaveBeenCalledTimes(1);
  });

  it('con "yo" resuelto, muestra la lista de chats a la izquierda', () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    useListaChats.mockReturnValue({
      chats: [{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }],
      cargando: false,
      cargandoMas: false,
      error: null,
      hasMore: false,
      cargarMas: cargarMasChats,
      registrarMensajeEnviado,
    });

    montar();

    expect(screen.getByRole('heading', { name: 'Chats' })).toBeInTheDocument();
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Hola!')).toBeInTheDocument();
  });

  it('sin "yo" resuelto todavía, no muestra la lista de chats', () => {
    montar();
    expect(screen.queryByRole('heading', { name: 'Chats' })).not.toBeInTheDocument();
  });

  it('al hacer click en un chat de la lista, abre esa conversación', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    useListaChats.mockReturnValue({
      chats: [{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }],
      cargando: false,
      cargandoMas: false,
      error: null,
      hasMore: false,
      cargarMas: cargarMasChats,
      registrarMensajeEnviado,
    });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });
  });

  it('al confirmarse un mensaje propio, registra el chat en la lista', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    useConversacion.mockReturnValue({
      mensajes: [
        {
          id: '1',
          remitente: 'mateo',
          destinatario: 'ana',
          contenido: 'Hola!',
          enviadoEn: '2026-01-01T00:00:00Z',
        },
      ],
      cargandoHistorial: false,
      errorHistorial: null,
      conectado: true,
      enviarMensaje: jest.fn(),
      reintentarHistorial: jest.fn(),
    });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user, 'ana');

    expect(registrarMensajeEnviado).toHaveBeenCalledWith(
      'ana',
      expect.objectContaining({ id: '1', contenido: 'Hola!' }),
    );
  });

  it('no registra en la lista un mensaje recibido (no propio)', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    useConversacion.mockReturnValue({
      mensajes: [
        {
          id: '1',
          remitente: 'ana',
          destinatario: 'mateo',
          contenido: 'Hola!',
          enviadoEn: '2026-01-01T00:00:00Z',
        },
      ],
      cargandoHistorial: false,
      errorHistorial: null,
      conectado: true,
      enviarMensaje: jest.fn(),
      reintentarHistorial: jest.fn(),
    });
    const user = userEvent.setup();
    montar();

    await elegirInterlocutor(user, 'ana');

    expect(registrarMensajeEnviado).not.toHaveBeenCalled();
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
