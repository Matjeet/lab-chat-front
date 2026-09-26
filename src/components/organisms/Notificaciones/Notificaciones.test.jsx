import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Notificaciones from './Notificaciones';
import { InterlocutorProvider, useInterlocutor } from '../../../context/InterlocutorContext';
import useNotificaciones from '../../../hooks/useNotificaciones';

// Se mockea al nivel del hook, no de fetch/Firebase: Notificaciones no
// necesita saber cómo se piden ni se actualizan, solo qué hace con lo que el
// hook expone — ver src/hooks/useNotificaciones.test.js para el hook en sí.
// Factory explícita: un automock sin factory cargaría el hook real, que
// importa firebase/auth (sin las variables de entorno que solo existen en
// build/dev).
jest.mock('../../../hooks/useNotificaciones', () => jest.fn());

// Sonda para leer, en el propio test, lo que quedó en el contexto tras
// aceptar una solicitud — sin esto no hay forma de observar `establecerCon`.
const SondaCon = () => {
  const { con } = useInterlocutor();
  return <p>con actual: {con || '(vacío)'}</p>;
};

const montar = (yo = 'mateo') =>
  render(
    <InterlocutorProvider>
      <Notificaciones yo={yo} />
      <SondaCon />
    </InterlocutorProvider>,
  );

const notificacionSolicitud = (extra = {}) => ({
  id: 1,
  remitente: 'ana',
  tipo: 'solicitud',
  leida: false,
  createdAt: '2026-01-01T00:00:00Z',
  ...extra,
});

let marcarLeida;
let marcarNoLeida;
let recargar;

const mockearHook = (overrides = {}) => {
  useNotificaciones.mockReturnValue({
    notificaciones: [],
    cargando: false,
    error: null,
    noLeidas: 0,
    recargar,
    marcarLeida,
    marcarNoLeida,
    ...overrides,
  });
};

beforeEach(() => {
  marcarLeida = jest.fn();
  marcarNoLeida = jest.fn();
  recargar = jest.fn();
  mockearHook();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Notificaciones', () => {
  it('empieza cerrada', () => {
    montar();
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre el panel al pulsar la campana, con el estado vacío', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    const panel = screen.getByRole('dialog', { name: 'Notificaciones' });
    expect(panel).toHaveTextContent('No tienes notificaciones por ahora.');
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('al abrir el panel, recarga la lista', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    expect(recargar).toHaveBeenCalled();
  });

  it('cierra el panel al volver a pulsar la campana', async () => {
    const user = userEvent.setup();
    montar();
    const campana = screen.getByRole('button', { name: 'Notificaciones' });

    await user.click(campana);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(campana);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el panel al pulsar Escape', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el panel al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(
      <InterlocutorProvider>
        <Notificaciones yo="mateo" />
        <button type="button">Fuera</button>
      </InterlocutorProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no se cierra al hacer clic dentro del panel', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByText('No tienes notificaciones por ahora.'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('mientras carga, muestra un aviso de carga', async () => {
    mockearHook({ cargando: true });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('si falla la carga, muestra un aviso de error', async () => {
    mockearHook({ error: { kind: 'servidor' } });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument();
  });

  it('sin notificaciones sin leer, no muestra insignia', () => {
    montar();
    expect(screen.queryByText(/sin leer/i)).not.toBeInTheDocument();
  });

  it('muestra la insignia con el número de notificaciones sin leer', () => {
    mockearHook({ noLeidas: 3 });
    montar();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('3 notificaciones sin leer')).toBeInTheDocument();
  });

  it('con más de 9 sin leer, la insignia muestra "9+"', () => {
    mockearHook({ noLeidas: 15 });
    montar();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('muestra una notificación de tipo solicitud, con sus botones de aceptar/rechazar', async () => {
    mockearHook({ notificaciones: [notificacionSolicitud()] });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    expect(screen.getByText('ana te envió una solicitud de chat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar solicitud de ana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar solicitud de ana' })).toBeInTheDocument();
  });

  it('al aceptar una solicitud, abre el chat con el remitente, la marca leída y cierra el panel', async () => {
    mockearHook({ notificaciones: [notificacionSolicitud()] });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByRole('button', { name: 'Aceptar solicitud de ana' }));

    expect(screen.getByText('con actual: ana')).toBeInTheDocument();
    expect(marcarLeida).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('al rechazar una solicitud, solo la marca leída (no abre ningún chat)', async () => {
    mockearHook({ notificaciones: [notificacionSolicitud()] });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByRole('button', { name: 'Rechazar solicitud de ana' }));

    expect(marcarLeida).toHaveBeenCalledWith(1);
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('al pasar el mouse sobre una notificación sin leer, la marca leída', async () => {
    mockearHook({ notificaciones: [notificacionSolicitud({ leida: false })] });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.hover(screen.getByText('ana te envió una solicitud de chat'));

    expect(marcarLeida).toHaveBeenCalledWith(1);
  });

  it('una notificación ya leída muestra el botón para marcarla como no leída', async () => {
    mockearHook({ notificaciones: [notificacionSolicitud({ leida: true })] });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByRole('button', { name: 'Marcar como no leída' }));

    expect(marcarNoLeida).toHaveBeenCalledWith(1);
  });
});
