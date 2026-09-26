import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HomePage from './HomePage';
import { InterlocutorProvider } from '../../../context/InterlocutorContext';
import { observarSesion } from '../../../firebase/auth';
import useConversacion from '../../../hooks/useConversacion';
import useMiUsuario from '../../../hooks/useMiUsuario';
import useListaChats from '../../../hooks/useListaChats';
import useExisteUsuario from '../../../hooks/useExisteUsuario';
import useCrearSolicitudChat from '../../../hooks/useCrearSolicitudChat';

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
// SelectorInterlocutor (montado dentro de HomePage, en la cabecera) usa estos
// dos hooks internamente para comprobar si el usuario existe y para mandar la
// solicitud de chat — se mockean aquí también para no depender de una sesión
// de Firebase real al enviar el formulario de la cabecera. Factory explícita:
// un automock sin factory cargaría el hook real, que importa firebase/auth.
jest.mock('../../../hooks/useExisteUsuario', () => jest.fn());
jest.mock('../../../hooks/useCrearSolicitudChat', () => jest.fn());

const establecerYo = jest.fn();
const registrarMensajeEnviado = jest.fn();
const cargarMasChats = jest.fn();
const comprobarUsuario = jest.fn().mockResolvedValue({ ok: true, data: { existe: true } });
const crearSolicitud = jest.fn().mockResolvedValue({
  ok: true,
  data: { id: '1', solicitante: 'mateo', solicitado: 'ana', aceptada: false, creadaEn: '2026-01-01T00:00:00Z', pendiente: true },
});

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
  useExisteUsuario.mockReturnValue(comprobarUsuario);
  useCrearSolicitudChat.mockReturnValue(crearSolicitud);
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

// SelectorInterlocutor (cabecera) ya no abre la conversación directamente:
// solo manda una solicitud de chat (ver SelectorInterlocutor.test.jsx para el
// detalle de ese flujo). El único camino que sigue conectando `con` de forma
// inmediata, dentro de HomePage, es elegir un chat ya existente en la lista
// de la izquierda — de ahí este helper, en vez de "escribir en la cabecera y
// pulsar Ir" como antes.
const elegirChatExistente = (chats) => {
  useListaChats.mockReturnValue({
    chats,
    cargando: false,
    cargandoMas: false,
    error: null,
    hasMore: false,
    cargarMas: cargarMasChats,
    registrarMensajeEnviado,
  });
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

  it('enviar una solicitud desde la cabecera avisa del envío y no abre la conversación directamente', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    const user = userEvent.setup();
    montar();

    const cabecera = screen.getByLabelText('Chatear con').closest('form');
    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    expect(await within(cabecera).findByRole('alertdialog', { name: 'Solicitud enviada' })).toHaveTextContent(
      'Solicitud enviada a ana. El chat empezará en cuanto la acepte.',
    );
    expect(crearSolicitud).toHaveBeenCalledWith('mateo', 'ana');
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('si el interlocutor activo coincide con "yo" (defensivo), no abre la conversación', async () => {
    // No alcanzable hoy desde la cabecera (ahora manda una solicitud, y el
    // backend la rechaza si solicitante === solicitado — ver
    // SelectorInterlocutor.test.jsx) ni desde una lista de chats real (nunca
    // incluye a "yo"). Se prueba aquí de todos modos, vía una lista de chats
    // contrived, como red de seguridad de este guard en HomePage.
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    elegirChatExistente([{ otroUsuario: 'mateo', ultimoMensaje: { contenido: 'Hola!' } }]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('mateo'));

    expect(
      await screen.findByText('No puedes chatear contigo mismo. Elige otro usuario en la cabecera.'),
    ).toBeInTheDocument();
    expect(useConversacion).not.toHaveBeenCalled();
  });

  it('al hacer click en un chat de la lista, abre esa conversación', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    elegirChatExistente([{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));

    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });
  });

  it('elegir otro chat de la lista cambia la conversación abierta', async () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    elegirChatExistente([
      { otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } },
      { otroUsuario: 'luis', ultimoMensaje: { contenido: 'Qué tal' } },
    ]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));
    expect(useConversacion).toHaveBeenCalledWith({ yo: 'mateo', con: 'ana' });

    await user.click(screen.getByText('luis'));
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
    elegirChatExistente([{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));

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
    elegirChatExistente([{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));

    expect(screen.getByText(/no se pudo cargar el historial/i)).toBeInTheDocument();

    // Es un botón-icono: el texto "Reintentar" vive en el aria-label, no
    // visible en pantalla — igual que ThemeToggle con su símbolo de tema.
    const botonReintentar = screen.getByRole('button', { name: 'Reintentar' });
    expect(botonReintentar).not.toHaveTextContent('Reintentar');
    expect(botonReintentar.querySelector('[aria-hidden="true"]')).toBeInTheDocument();

    await user.click(botonReintentar);

    expect(reintentarHistorial).toHaveBeenCalledTimes(1);
  });

  it('con "yo" resuelto, muestra la lista de chats a la izquierda', () => {
    useMiUsuario.mockReturnValue({ yo: 'mateo', establecerYo });
    elegirChatExistente([{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }]);

    montar();

    expect(screen.getByRole('heading', { name: 'Chats' })).toBeInTheDocument();
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Hola!')).toBeInTheDocument();
  });

  it('sin "yo" resuelto todavía, no muestra la lista de chats', () => {
    montar();
    expect(screen.queryByRole('heading', { name: 'Chats' })).not.toBeInTheDocument();
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
    elegirChatExistente([{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));

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
    elegirChatExistente([{ otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } }]);
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByText('ana'));

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
