import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ListaChats from './ListaChats';

const CHATS = [
  { otroUsuario: 'ana', ultimoMensaje: { contenido: 'Hola!' } },
  { otroUsuario: 'luis', ultimoMensaje: { contenido: 'Nos vemos mañana' } },
];

const props = (extra = {}) => ({
  chats: CHATS,
  cargando: false,
  cargandoMas: false,
  error: null,
  hasMore: false,
  chatActivo: '',
  onCargarMas: jest.fn(),
  onSeleccionar: jest.fn(),
  ...extra,
});

describe('ListaChats', () => {
  it('muestra cada chat con el otro usuario y su último mensaje', () => {
    render(<ListaChats {...props()} />);
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Hola!')).toBeInTheDocument();
    expect(screen.getByText('luis')).toBeInTheDocument();
    expect(screen.getByText('Nos vemos mañana')).toBeInTheDocument();
  });

  it('mientras carga, avisa en vez de mostrar la lista', () => {
    render(<ListaChats {...props({ cargando: true })} />);
    expect(screen.getByText(/cargando chats/i)).toBeInTheDocument();
    expect(screen.queryByText('ana')).not.toBeInTheDocument();
  });

  it('si falla, avisa del error', () => {
    render(<ListaChats {...props({ error: { kind: 'servidor' } })} />);
    expect(screen.getByText(/no se pudo cargar la lista de chats/i)).toBeInTheDocument();
  });

  it('sin chats, muestra un aviso de lista vacía', () => {
    render(<ListaChats {...props({ chats: [] })} />);
    expect(screen.getByText(/todavía no tienes chats/i)).toBeInTheDocument();
  });

  it('al hacer click en un chat, llama a onSeleccionar con su otroUsuario', async () => {
    const user = userEvent.setup();
    const onSeleccionar = jest.fn();
    render(<ListaChats {...props({ onSeleccionar })} />);

    await user.click(screen.getByText('ana'));

    expect(onSeleccionar).toHaveBeenCalledWith('ana');
  });

  it('marca como activo el chat que coincide con chatActivo', () => {
    render(<ListaChats {...props({ chatActivo: 'luis' })} />);
    expect(screen.getByText('luis').closest('button')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('ana').closest('button')).not.toHaveAttribute('aria-current');
  });

  it('mientras carga más (scroll infinito), avisa sin ocultar la lista ya cargada', () => {
    render(<ListaChats {...props({ hasMore: true, cargandoMas: true })} />);
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText(/cargando más/i)).toBeInTheDocument();
  });

  it('llama a onCargarMas cuando el centinela se hace visible', () => {
    // Fake controlable: captura el callback que pasa ListaChats y deja que
    // el test dispare la intersección a mano, en vez de depender de un
    // IntersectionObserver real (jsdom no lo implementa, ver setupTests.js).
    const observe = jest.fn();
    const disconnect = jest.fn();
    let callbackCapturado;
    const IntersectionObserverOriginal = global.IntersectionObserver;
    global.IntersectionObserver = jest.fn((callback) => {
      callbackCapturado = callback;
      return { observe, disconnect, unobserve: jest.fn() };
    });

    const onCargarMas = jest.fn();
    render(<ListaChats {...props({ hasMore: true, onCargarMas })} />);

    expect(observe).toHaveBeenCalled();
    callbackCapturado([{ isIntersecting: true }]);

    expect(onCargarMas).toHaveBeenCalledTimes(1);

    global.IntersectionObserver = IntersectionObserverOriginal;
  });

  it('sin hasMore, no observa el centinela (no hay más que cargar)', () => {
    const observe = jest.fn();
    const IntersectionObserverOriginal = global.IntersectionObserver;
    global.IntersectionObserver = jest.fn(() => ({
      observe,
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }));

    render(<ListaChats {...props({ hasMore: false })} />);

    expect(observe).not.toHaveBeenCalled();

    global.IntersectionObserver = IntersectionObserverOriginal;
  });
});
